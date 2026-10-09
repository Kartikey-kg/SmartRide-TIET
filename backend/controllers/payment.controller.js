// backend/controllers/payment.controller.js
// Phase 5 — Razorpay payment controller: orders, verification, wallet

const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');
const { createRazorpayOrder, verifySignature, fetchPayment } = require('../services/razorpay.service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-order
// Creates a Razorpay order for a given rideId or wallet top-up
// ─────────────────────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { rideId, type = 'ride' } = req.body; // type: 'ride' | 'wallet'
    const userId = req.user.uid;

    let amountInPaise, receipt, notes;

    if (type === 'wallet') {
      // Wallet top-up
      const { amount } = req.body; // amount in rupees
      if (!amount || amount < 10 || amount > 10000) {
        return res.status(400).json({ error: 'Top-up amount must be between ₹10 and ₹10,000' });
      }
      amountInPaise = Math.round(amount * 100);
      // Razorpay receipt max = 40 chars; keep compact
      receipt       = `wlt_${userId.slice(0, 12)}_${Date.now().toString().slice(-8)}`;
      notes         = { userId, type: 'wallet_topup', amount };
    } else {
      // Ride payment
      if (!rideId) return res.status(400).json({ error: 'rideId is required' });

      const rideDoc = await db.collection('rides').doc(rideId).get();
      if (!rideDoc.exists) return res.status(404).json({ error: 'Ride not found' });

      const ride = rideDoc.data();
      if (ride.studentId !== userId) {
        return res.status(403).json({ error: 'Not your ride' });
      }
      if (ride.paymentStatus === 'paid') {
        return res.status(400).json({ error: 'Ride already paid' });
      }

      amountInPaise = Math.round((ride.fare || 0) * 100);
      // Firestore IDs are 20 chars → ride_ + 20 = 25 chars, safely within 40
      receipt       = `ride_${rideId}`;
      notes         = { userId, rideId, type: 'ride_payment', fare: ride.fare };
    }

    const order = await createRazorpayOrder(amountInPaise, receipt, notes);

    // Save pending order to Firestore for audit trail
    await db.collection('paymentOrders').doc(order.id).set({
      razorpayOrderId: order.id,
      userId,
      type,
      rideId: rideId || null,
      amount: amountInPaise / 100,
      currency: 'INR',
      status: 'created',
      createdAt: FieldValue.serverTimestamp(),
    });

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
      receipt:  order.receipt,
    });
  } catch (err) {
    console.error('❌ createOrder error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Verifies Razorpay HMAC signature — CRITICAL security step
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      rideId,
      type = 'ride',
    } = req.body;

    const userId = req.user.uid;

    // 1. Verify HMAC signature
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature — possible fraud attempt' });
    }

    // 2. Fetch payment details from Razorpay
    const paymentDetails = await fetchPayment(razorpay_payment_id);

    const batch = db.batch();
    const now   = FieldValue.serverTimestamp();

    // 3. Save payment record
    const paymentRef = db.collection('payments').doc(razorpay_payment_id);
    batch.set(paymentRef, {
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId:   razorpay_order_id,
      userId,
      rideId:   rideId || null,
      type,
      amount:   paymentDetails.amount / 100,
      currency: paymentDetails.currency,
      method:   paymentDetails.method,
      status:   'paid',
      paidAt:   now,
    });

    // 4. Update paymentOrders doc
    const orderRef = db.collection('paymentOrders').doc(razorpay_order_id);
    batch.update(orderRef, {
      status:            'paid',
      razorpayPaymentId: razorpay_payment_id,
      paidAt:            now,
    });

    if (type === 'ride' && rideId) {
      // 5a. Update ride payment status
      const rideRef = db.collection('rides').doc(rideId);
      batch.update(rideRef, {
        paymentStatus:     'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId:   razorpay_order_id,
        paidAt:            now,
      });
    } else if (type === 'wallet') {
      // 5b. Credit wallet balance
      const walletRef = db.collection('wallets').doc(userId);
      const walletDoc = await walletRef.get();
      const currentBal = walletDoc.exists ? (walletDoc.data().balance || 0) : 0;
      const addAmount  = paymentDetails.amount / 100;

      batch.set(walletRef, {
        userId,
        balance:     currentBal + addAmount,
        updatedAt:   now,
      }, { merge: true });

      // Save wallet transaction
      const txRef = db.collection('wallets').doc(userId).collection('transactions').doc();
      batch.set(txRef, {
        type:      'credit',
        amount:    addAmount,
        method:    paymentDetails.method,
        paymentId: razorpay_payment_id,
        note:      'Wallet top-up',
        createdAt: now,
      });
    }

    await batch.commit();

    res.json({
      success:   true,
      paymentId: razorpay_payment_id,
      amount:    paymentDetails.amount / 100,
      method:    paymentDetails.method,
    });
  } catch (err) {
    console.error('❌ verifyPayment error:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/wallet/topup
// Create Razorpay order specifically for wallet top-up
// ─────────────────────────────────────────────────────────────────────────────
exports.topupWallet = async (req, res) => {
  req.body.type = 'wallet';
  return exports.createOrder(req, res);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/wallet/balance
// Get wallet balance for current user
// ─────────────────────────────────────────────────────────────────────────────
exports.getWalletBalance = async (req, res) => {
  try {
    const userId   = req.user.uid;
    const walletDoc = await db.collection('wallets').doc(userId).get();

    if (!walletDoc.exists) {
      return res.json({ balance: 0, userId });
    }

    res.json({ balance: walletDoc.data().balance || 0, userId });
  } catch (err) {
    console.error('❌ getWalletBalance error:', err);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/wallet/pay
// Pay for a ride using wallet balance
// ─────────────────────────────────────────────────────────────────────────────
exports.walletPay = async (req, res) => {
  try {
    const { rideId } = req.body;
    const userId     = req.user.uid;

    if (!rideId) return res.status(400).json({ error: 'rideId is required' });

    const [rideDoc, walletDoc] = await Promise.all([
      db.collection('rides').doc(rideId).get(),
      db.collection('wallets').doc(userId).get(),
    ]);

    if (!rideDoc.exists) return res.status(404).json({ error: 'Ride not found' });

    const ride    = rideDoc.data();
    const balance = walletDoc.exists ? (walletDoc.data().balance || 0) : 0;

    if (ride.studentId !== userId) return res.status(403).json({ error: 'Not your ride' });
    if (ride.paymentStatus === 'paid') return res.status(400).json({ error: 'Already paid' });

    const fare = ride.fare || 0;
    if (balance < fare) {
      return res.status(400).json({ error: `Insufficient wallet balance. Need ₹${fare}, have ₹${balance.toFixed(2)}` });
    }

    const batch = db.batch();
    const now   = FieldValue.serverTimestamp();

    // Deduct from wallet
    batch.update(db.collection('wallets').doc(userId), {
      balance:   balance - fare,
      updatedAt: now,
    });

    // Wallet transaction record
    const txRef = db.collection('wallets').doc(userId).collection('transactions').doc();
    batch.set(txRef, {
      type:      'debit',
      amount:    fare,
      method:    'wallet',
      rideId,
      note:      `Ride payment — ${ride.pickupAddress || ride.pickup || ''} → ${ride.dropAddress || ride.destination || ''}`,
      createdAt: now,
    });

    // Update ride
    batch.update(db.collection('rides').doc(rideId), {
      paymentStatus: 'paid',
      paymentMethod: 'wallet',
      paidAt:        now,
    });

    // Payment record
    const payRef = db.collection('payments').doc();
    batch.set(payRef, {
      userId,
      rideId,
      type:      'ride',
      amount:    fare,
      method:    'wallet',
      status:    'paid',
      paidAt:    now,
    });

    await batch.commit();

    res.json({ success: true, newBalance: balance - fare, method: 'wallet' });
  } catch (err) {
    console.error('❌ walletPay error:', err);
    res.status(500).json({ error: 'Wallet payment failed' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/history
// Paginated payment history for current user
// ─────────────────────────────────────────────────────────────────────────────
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit  = parseInt(req.query.limit) || 20;

    const snap = await db.collection('payments')
      .where('userId', '==', userId)
      .orderBy('paidAt', 'desc')
      .limit(limit)
      .get();

    const payments = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      paidAt: doc.data().paidAt?.toDate?.()?.toISOString() || null,
    }));

    res.json({ payments });
  } catch (err) {
    console.error('❌ getPaymentHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/wallet/transactions
// Wallet transaction history
// ─────────────────────────────────────────────────────────────────────────────
exports.getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.uid;
    const limit  = parseInt(req.query.limit) || 20;

    const snap = await db.collection('wallets').doc(userId)
      .collection('transactions')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const transactions = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    res.json({ transactions });
  } catch (err) {
    console.error('❌ getWalletTransactions error:', err);
    res.status(500).json({ error: 'Failed to fetch wallet transactions' });
  }
};
