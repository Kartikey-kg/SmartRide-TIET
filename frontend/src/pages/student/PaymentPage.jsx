// src/pages/student/PaymentPage.jsx
// Phase 5 — Full payment page: fare summary, Razorpay/wallet checkout, receipt

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { getRideById } from '../../services/api';
import {
  loadRazorpayScript,
  openRazorpayCheckout,
  createOrder,
  verifyPayment,
  walletPay,
  getWalletBalance,
} from '../../services/paymentService';
import './PaymentPage.css';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxx';

const PaymentPage = () => {
  const { rideId }          = useParams();
  const { user }            = useAuth();
  const navigate            = useNavigate();

  const [ride,        setRide]        = useState(null);
  const [walletBal,   setWalletBal]   = useState(0);
  const [payMethod,   setPayMethod]   = useState('razorpay');
  const [loading,     setLoading]     = useState(true);
  const [paying,      setPaying]      = useState(false);
  const [success,     setSuccess]     = useState(null); // payment result on success

  // ── Load ride + wallet balance ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [rideData, walletData] = await Promise.all([
          getRideById(rideId),
          getWalletBalance(),
        ]);
        setRide(rideData.ride || rideData);
        setWalletBal(walletData.balance || 0);
      } catch (err) {
        toast.error('Could not load ride details.');
      }
      setLoading(false);
    };
    if (rideId) load();
  }, [rideId]);

  const fare     = ride?.fare || 0;
  const canWallet = walletBal >= fare;

  // ── Razorpay payment ────────────────────────────────────────
  const handleRazorpay = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check your connection.');
        setPaying(false);
        return;
      }

      const orderData = await createOrder(rideId);

      openRazorpayCheckout(
        { ...orderData, description: `Ride: ${ride?.pickupAddress} → ${ride?.dropAddress}` },
        { name: user?.displayName || '', email: user?.email || '' },
        async (payResult) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id:   payResult.razorpay_order_id,
              razorpay_payment_id: payResult.razorpay_payment_id,
              razorpay_signature:  payResult.razorpay_signature,
              rideId,
              type: 'ride',
            });
            toast.success('🎉 Payment successful!');
            setSuccess({ ...result, paymentId: payResult.razorpay_payment_id, method: 'Razorpay' });
          } catch (err) {
            toast.error(err.error || 'Verification failed. Contact support.');
          }
          setPaying(false);
        },
        (err) => {
          if (err?.code !== 'MODAL_CLOSED') {
            toast.error(err?.description || 'Payment failed.');
          }
          setPaying(false);
        }
      );
    } catch (err) {
      toast.error(err.error || 'Could not initiate payment.');
      setPaying(false);
    }
  };

  // ── Wallet payment ──────────────────────────────────────────
  const handleWallet = async () => {
    if (!canWallet) {
      toast.error(`Insufficient wallet balance. Need ₹${fare}, have ₹${walletBal.toFixed(2)}`);
      return;
    }
    setPaying(true);
    try {
      const result = await walletPay(rideId);
      toast.success(`✅ ₹${fare} paid from wallet!`);
      setSuccess({
        ...result,
        amount: fare,
        method: 'SmartRide Wallet',
        paymentId: `WALLET-${Date.now()}`,
      });
    } catch (err) {
      toast.error(err.error || 'Wallet payment failed.');
    }
    setPaying(false);
  };

  const handlePay = () => payMethod === 'wallet' ? handleWallet() : handleRazorpay();

  // ── Loading skeleton ────────────────────────────────────────
  if (loading) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="payment-body">
          <div className="pay-card">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pay-skeleton" style={{ width: i % 2 === 0 ? '60%' : '100%' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Null ride guard (fetch failed or invalid rideId) ────────
  if (!loading && !ride) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="payment-body">
          <div className="pay-success">
            <div className="pay-success-icon">⚠️</div>
            <h2>Ride Not Found</h2>
            <p>We couldn't load your ride details. Please try again.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
              <button
                className="pay-back-btn"
                onClick={() => window.location.reload()}
              >
                🔄 Retry
              </button>
              <Link to="/student/dashboard" className="pay-back-btn">
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Already paid guard ──────────────────────────────────────
  if (ride?.paymentStatus === 'paid' && !success) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="payment-body">
          <div className="pay-success">
            <div className="pay-success-icon">✅</div>
            <h2>Already Paid</h2>
            <p>This ride has already been paid for.</p>
            <Link to="/student/dashboard" className="pay-back-btn">← Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ──────────────────────────────────────────
  if (success) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="payment-body">
          <div className="pay-success">
            <div className="pay-success-icon">🎉</div>
            <h2>Payment Successful!</h2>
            <p>Your ride payment has been confirmed.</p>
            <div className="pay-success-amount">₹{success.amount || fare}</div>
            <div className="pay-success-method">Paid via {success.method}</div>

            <div className="pay-receipt-box">
              <div className="pay-receipt-row">
                <span>Payment ID</span>
                <span>{success.paymentId?.slice(0, 18)}…</span>
              </div>
              <div className="pay-receipt-row">
                <span>Pickup</span>
                <span>{ride?.pickupAddress}</span>
              </div>
              <div className="pay-receipt-row">
                <span>Destination</span>
                <span>{ride?.dropAddress}</span>
              </div>
              <div className="pay-receipt-row">
                <span>Amount</span>
                <span>₹{success.amount || fare}</span>
              </div>
              <div className="pay-receipt-row">
                <span>Method</span>
                <span>{success.method}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/student/dashboard" className="pay-back-btn">🏠 Dashboard</Link>
              <Link to="/student/history" className="pay-back-btn">📋 Ride History</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main payment UI ─────────────────────────────────────────
  const isCampus = ride?.isCampusInternal;

  return (
    <div className="payment-page">
      <Navbar />
      <div className="payment-body">

        {/* Hero */}
        <div className="payment-hero">
          <div className="payment-hero-icon">💳</div>
          <div>
            <h1>Complete Your Payment</h1>
            <p>Secure checkout powered by Razorpay • 256-bit SSL encrypted</p>
          </div>
        </div>

        {/* Route Summary */}
        <div className="pay-card">
          <div className="pay-card-title">Ride Summary</div>
          <div className="pay-route">
            <div className="pay-route-stop">
              <div className="pay-route-dot pickup" />
              <div>
                <div className="pay-route-label">Pickup</div>
                <div className="pay-route-val">{ride?.pickupAddress}</div>
              </div>
            </div>
            <div className="pay-route-line" />
            <div className="pay-route-stop">
              <div className="pay-route-dot dest" />
              <div>
                <div className="pay-route-label">Destination</div>
                <div className="pay-route-val">{ride?.dropAddress}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="pay-card">
          <div className="pay-card-title">Fare Breakdown</div>
          <div className="pay-fare-rows">
            <div className="pay-fare-row">
              <span>Base Fare</span>
              <span>₹{isCampus ? 10 : (fare * 0.75).toFixed(2)}</span>
            </div>
            {!isCampus && ride?.distance && (
              <div className="pay-fare-row">
                <span>Distance ({ride.distance} km)</span>
                <span>₹{(fare * 0.25).toFixed(2)}</span>
              </div>
            )}
            {isCampus && (
              <div className="pay-fare-row">
                <span>Campus Flat Rate</span>
                <span style={{ color: '#22c55e' }}>✓ Applied</span>
              </div>
            )}
            <div className="pay-fare-row">
              <span>Platform Fee</span>
              <span>₹0.00</span>
            </div>
            <div className="pay-fare-row total">
              <span>
                Total
                {isCampus && <span className="pay-fare-badge">CAMPUS ₹10 FLAT</span>}
              </span>
              <span className="pay-fare-amount">₹{fare}</span>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="pay-card">
          <div className="pay-card-title">SmartRide Wallet</div>
          <div className="pay-wallet-widget">
            <div>
              <div className="pay-wallet-bal-label">Available Balance</div>
              <div className="pay-wallet-bal">₹{walletBal.toFixed(2)}</div>
            </div>
            <Link to="/student/wallet" className="pay-wallet-topup-link">+ Top Up</Link>
          </div>
        </div>

        {/* Payment Method */}
        <div className="pay-card">
          <div className="pay-card-title">Payment Method</div>
          <div className="pay-methods">
            <button
              className={`pay-method-opt${payMethod === 'razorpay' ? ' selected' : ''}`}
              onClick={() => setPayMethod('razorpay')}
            >
              <span className="pay-method-emoji">💸</span>
              <div className="pay-method-info">
                <div className="pay-method-name">Razorpay Checkout</div>
                <div className="pay-method-desc">UPI · Credit/Debit Cards · Net Banking · Wallets</div>
              </div>
              <div className="pay-method-radio" />
            </button>

            <button
              className={`pay-method-opt${payMethod === 'wallet' ? ' selected' : ''}${!canWallet ? ' disabled' : ''}`}
              onClick={() => canWallet && setPayMethod('wallet')}
              disabled={!canWallet}
            >
              <span className="pay-method-emoji">👛</span>
              <div className="pay-method-info">
                <div className="pay-method-name">
                  SmartRide Wallet
                  {!canWallet && <span className="pay-low-badge">Insufficient</span>}
                </div>
                <div className="pay-method-desc">
                  Balance: ₹{walletBal.toFixed(2)} — Instant, no extra charges
                </div>
              </div>
              <div className="pay-method-radio" />
            </button>
          </div>

          <button
            className="pay-cta-btn"
            onClick={handlePay}
            disabled={paying}
          >
            {paying
              ? <span className="pay-spinner" />
              : `Pay ₹${fare} ${payMethod === 'wallet' ? 'from Wallet' : 'via Razorpay'}`}
          </button>
          <p className="pay-secure">🔒 Payments secured by Razorpay · PCI DSS compliant</p>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center' }}>
          <Link to="/student/dashboard" style={{ fontSize: '0.82rem', color: '#6666a0', textDecoration: 'none' }}>
            ← Cancel and go back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
