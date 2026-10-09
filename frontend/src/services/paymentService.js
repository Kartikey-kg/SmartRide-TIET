// src/services/paymentService.js
// Phase 5 — Razorpay payment service: order creation, checkout, wallet ops

import api from './api';

// ── Load Razorpay checkout.js script dynamically ──────────────────
export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script    = document.createElement('script');
    script.id       = 'razorpay-script';
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });

// ── Create Razorpay order (ride payment) ─────────────────────────
export const createOrder = (rideId) =>
  api.post('/payments/create-order', { rideId, type: 'ride' });

// ── Create wallet top-up order ───────────────────────────────────
export const createTopupOrder = (amount) =>
  api.post('/payments/create-order', { type: 'wallet', amount });

// ── Verify payment after Razorpay checkout ───────────────────────
export const verifyPayment = (data) => api.post('/payments/verify', data);

// ── Wallet balance ────────────────────────────────────────────────
export const getWalletBalance = () => api.get('/payments/wallet/balance');

// ── Wallet transactions ───────────────────────────────────────────
export const getWalletTransactions = (limit = 20) =>
  api.get('/payments/wallet/transactions', { params: { limit } });

// ── Pay from wallet ───────────────────────────────────────────────
export const walletPay = (rideId) =>
  api.post('/payments/wallet/pay', { rideId });

// ── Payment history ───────────────────────────────────────────────
export const getPaymentHistory = (limit = 20) =>
  api.get('/payments/history', { params: { limit } });

// ── Open Razorpay modal ───────────────────────────────────────────
/**
 * @param {object} orderData  - { orderId, amount, currency, keyId }
 * @param {object} prefill    - { name, email, contact }
 * @param {function} onSuccess - callback(paymentResult)
 * @param {function} onFailure - callback(error)
 */
export const openRazorpayCheckout = (orderData, prefill, onSuccess, onFailure) => {
  const options = {
    key:         orderData.keyId,
    amount:      orderData.amount,
    currency:    orderData.currency || 'INR',
    name:        'SmartRideTIET',
    description: orderData.description || 'Campus Ride Payment',
    image:       '/favicon.svg',
    order_id:    orderData.orderId,
    prefill: {
      name:    prefill?.name    || '',
      email:   prefill?.email   || '',
      contact: prefill?.contact || '',
    },
    notes: orderData.notes || {},
    theme: { color: '#a78bfa' },
    modal: {
      ondismiss: () => onFailure?.({ code: 'MODAL_CLOSED', description: 'Payment cancelled by user' }),
    },
    handler: (response) => onSuccess?.(response),
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (response) => onFailure?.(response.error));
  rzp.open();
};
