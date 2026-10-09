// src/components/common/PaymentModal.jsx
// Phase 5 — Reusable payment confirmation modal with fare breakdown

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  loadRazorpayScript,
  openRazorpayCheckout,
  createOrder,
  verifyPayment,
  walletPay,
} from '../../services/paymentService';

const PaymentModal = ({ isOpen, onClose, ride, walletBalance = 0, onPaymentSuccess }) => {
  const [payMethod, setPayMethod]   = useState('razorpay'); // 'razorpay' | 'wallet'
  const [loading,   setLoading]     = useState(false);

  if (!isOpen || !ride) return null;

  const fare       = ride.fare || 0;
  const canWallet  = walletBalance >= fare;

  // ── Handle Razorpay payment ──────────────────────────────────
  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.');
        setLoading(false);
        return;
      }

      const orderData = await createOrder(ride.id);

      openRazorpayCheckout(
        orderData,
        { name: ride.studentName || '', email: ride.studentEmail || '' },
        async (paymentResult) => {
          // Success: verify on backend
          try {
            const result = await verifyPayment({
              razorpay_order_id:   paymentResult.razorpay_order_id,
              razorpay_payment_id: paymentResult.razorpay_payment_id,
              razorpay_signature:  paymentResult.razorpay_signature,
              rideId:              ride.id,
              type:                'ride',
            });
            toast.success(`✅ Payment successful! ₹${fare} paid via ${result.method || 'Razorpay'}`);
            onPaymentSuccess?.({ ...result, method: 'razorpay' });
            onClose();
          } catch (err) {
            toast.error(err.error || 'Payment verification failed. Contact support.');
          }
          setLoading(false);
        },
        (err) => {
          if (err?.code !== 'MODAL_CLOSED') {
            toast.error(err?.description || 'Payment failed. Please try again.');
          }
          setLoading(false);
        }
      );
    } catch (err) {
      toast.error(err.error || 'Could not initiate payment.');
      setLoading(false);
    }
  };

  // ── Handle Wallet payment ────────────────────────────────────
  const handleWalletPay = async () => {
    if (!canWallet) {
      toast.error(`Insufficient wallet balance. Need ₹${fare}, have ₹${walletBalance.toFixed(2)}`);
      return;
    }
    setLoading(true);
    try {
      const result = await walletPay(ride.id);
      toast.success(`✅ ₹${fare} paid from wallet! New balance: ₹${result.newBalance?.toFixed(2)}`);
      onPaymentSuccess?.({ ...result, method: 'wallet' });
      onClose();
    } catch (err) {
      toast.error(err.error || 'Wallet payment failed.');
    }
    setLoading(false);
  };

  const handlePay = () => {
    if (payMethod === 'wallet') handleWalletPay();
    else handleRazorpay();
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-card" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="pm-header">
          <div className="pm-icon">💳</div>
          <h2 className="pm-title">Complete Payment</h2>
          <button className="pm-close" onClick={onClose}>✕</button>
        </div>

        {/* Fare Breakdown */}
        <div className="pm-fare-box">
          <div className="pm-fare-row">
            <span>Pickup</span>
            <span className="pm-fare-val">{ride.pickup}</span>
          </div>
          <div className="pm-fare-row">
            <span>Destination</span>
            <span className="pm-fare-val">{ride.destination}</span>
          </div>
          {ride.distance && (
            <div className="pm-fare-row">
              <span>Distance</span>
              <span className="pm-fare-val">{ride.distance} km</span>
            </div>
          )}
          <div className="pm-fare-divider" />
          <div className="pm-fare-row pm-fare-total">
            <span>Total Fare</span>
            <span className="pm-fare-amount">₹{fare}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="pm-method-label">Choose Payment Method</div>
        <div className="pm-methods">
          <button
            className={`pm-method-btn${payMethod === 'razorpay' ? ' active' : ''}`}
            onClick={() => setPayMethod('razorpay')}
          >
            <span className="pm-method-icon">💸</span>
            <div>
              <div className="pm-method-name">Razorpay</div>
              <div className="pm-method-sub">UPI · Cards · Net Banking</div>
            </div>
            {payMethod === 'razorpay' && <span className="pm-check">✓</span>}
          </button>

          <button
            className={`pm-method-btn${payMethod === 'wallet' ? ' active' : ''} ${!canWallet ? 'disabled' : ''}`}
            onClick={() => setPayMethod('wallet')}
            disabled={!canWallet}
          >
            <span className="pm-method-icon">👛</span>
            <div>
              <div className="pm-method-name">
                SmartRide Wallet
                {!canWallet && <span className="pm-low-badge">Low Balance</span>}
              </div>
              <div className="pm-method-sub">Balance: ₹{walletBalance?.toFixed(2) || '0.00'}</div>
            </div>
            {payMethod === 'wallet' && <span className="pm-check">✓</span>}
          </button>
        </div>

        {/* Pay Button */}
        <button
          className={`pm-pay-btn${loading ? ' loading' : ''}`}
          onClick={handlePay}
          disabled={loading}
        >
          {loading ? (
            <span className="pm-spinner" />
          ) : (
            `Pay ₹${fare} ${payMethod === 'wallet' ? 'from Wallet' : 'via Razorpay'}`
          )}
        </button>

        <p className="pm-secure">🔒 Secured by Razorpay · 256-bit SSL</p>
      </div>

      <style>{`
        .pm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: pmFadeIn 0.2s ease;
        }
        @keyframes pmFadeIn { from { opacity:0 } to { opacity:1 } }

        .pm-card {
          background: linear-gradient(145deg, #0f0f2a 0%, #12122e 100%);
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 20px;
          padding: 2rem;
          width: 100%; max-width: 420px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.05);
          animation: pmSlideUp 0.25s ease;
          font-family: 'Inter', sans-serif;
        }
        @keyframes pmSlideUp { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }

        .pm-header {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 1.5rem;
          position: relative;
        }
        .pm-icon { font-size: 1.6rem; }
        .pm-title { font-size: 1.15rem; font-weight: 700; color: #e8e8ff; flex: 1; }
        .pm-close {
          background: none; border: none; color: #6666a0; font-size: 1rem;
          cursor: pointer; padding: 4px 8px; border-radius: 6px;
          transition: color 0.2s;
        }
        .pm-close:hover { color: #e8e8ff; }

        .pm-fare-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 1rem 1.1rem;
          margin-bottom: 1.25rem;
        }
        .pm-fare-row {
          display: flex; justify-content: space-between;
          font-size: 0.82rem; color: #9999cc; margin-bottom: 0.45rem;
        }
        .pm-fare-val { color: #c8c8e8; font-weight: 500; max-width: 55%; text-align: right; }
        .pm-fare-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 0.6rem 0; }
        .pm-fare-total { font-size: 0.9rem; font-weight: 600; color: #e8e8ff; margin-bottom: 0; }
        .pm-fare-amount { color: #a78bfa; font-size: 1.15rem; font-weight: 800; }

        .pm-method-label {
          font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px;
          color: #4a4a70; margin-bottom: 0.6rem;
        }
        .pm-methods { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.4rem; }

        .pm-method-btn {
          display: flex; align-items: center; gap: 0.75rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 0.85rem 1rem;
          cursor: pointer; text-align: left;
          transition: all 0.2s; color: #e8e8ff; width: 100%;
        }
        .pm-method-btn:hover:not(.disabled) {
          border-color: rgba(167,139,250,0.3);
          background: rgba(167,139,250,0.06);
        }
        .pm-method-btn.active {
          border-color: rgba(167,139,250,0.5);
          background: rgba(167,139,250,0.1);
          box-shadow: 0 0 0 1px rgba(167,139,250,0.15);
        }
        .pm-method-btn.disabled { opacity: 0.5; cursor: not-allowed; }
        .pm-method-icon { font-size: 1.4rem; }
        .pm-method-name { font-size: 0.87rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; }
        .pm-method-sub { font-size: 0.73rem; color: #6666a0; margin-top: 1px; }
        .pm-check { margin-left: auto; color: #a78bfa; font-weight: 700; font-size: 1rem; }
        .pm-low-badge {
          font-size: 0.62rem; background: rgba(239,68,68,0.15);
          color: #ef4444; border-radius: 4px; padding: 1px 5px;
        }

        .pm-pay-btn {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
          border: none; border-radius: 12px;
          color: #fff; font-weight: 700; font-size: 0.97rem;
          padding: 0.9rem;
          cursor: pointer;
          transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          min-height: 48px;
          box-shadow: 0 4px 20px rgba(124,58,237,0.35);
        }
        .pm-pay-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(124,58,237,0.5);
        }
        .pm-pay-btn.loading, .pm-pay-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .pm-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        .pm-secure {
          text-align: center; font-size: 0.72rem; color: #4a4a70;
          margin-top: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default PaymentModal;
