// backend/services/razorpay.service.js
// Razorpay SDK wrapper — order creation + signature verification

const Razorpay = require('razorpay');
const crypto  = require('crypto');

// ── Razorpay instance ─────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 * @param {number} amountInPaise  - Amount in paise (₹10 → 1000)
 * @param {string} receipt        - Unique receipt ID (rideId or topupId)
 * @param {object} notes          - Optional metadata notes
 */
const createRazorpayOrder = async (amountInPaise, receipt, notes = {}) => {
  const options = {
    amount:   amountInPaise,
    currency: 'INR',
    receipt,
    notes,
  };
  const order = await razorpay.orders.create(options);
  return order;
};

/**
 * Verify Razorpay payment signature (HMAC-SHA256)
 * Signature = HMAC(key_secret, orderId + "|" + paymentId)
 */
const verifySignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const body      = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === razorpaySignature;
};

/**
 * Fetch payment details from Razorpay
 */
const fetchPayment = async (paymentId) => {
  return await razorpay.payments.fetch(paymentId);
};

module.exports = { createRazorpayOrder, verifySignature, fetchPayment };
