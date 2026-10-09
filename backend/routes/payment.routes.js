// backend/routes/payment.routes.js
// Phase 5 — Razorpay payment routes

const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const paymentController = require('../controllers/payment.controller');

// ── Razorpay Order & Verification ─────────────────────────────────
// POST /api/payments/create-order  → Create Razorpay order (ride or wallet)
router.post('/create-order', verifyToken, requireRole('student'), paymentController.createOrder);

// POST /api/payments/verify        → Verify payment signature after checkout
router.post('/verify', verifyToken, paymentController.verifyPayment);

// ── Wallet Routes ─────────────────────────────────────────────────
// GET  /api/payments/wallet/balance       → Get wallet balance
router.get('/wallet/balance', verifyToken, paymentController.getWalletBalance);

// POST /api/payments/wallet/topup         → Create top-up Razorpay order
router.post('/wallet/topup', verifyToken, requireRole('student'), paymentController.topupWallet);

// POST /api/payments/wallet/pay           → Pay for a ride using wallet
router.post('/wallet/pay', verifyToken, requireRole('student'), paymentController.walletPay);

// GET  /api/payments/wallet/transactions  → Wallet transaction history
router.get('/wallet/transactions', verifyToken, paymentController.getWalletTransactions);

// ── Payment History ───────────────────────────────────────────────
// GET  /api/payments/history → Paginated payment history
router.get('/history', verifyToken, paymentController.getPaymentHistory);

module.exports = router;
