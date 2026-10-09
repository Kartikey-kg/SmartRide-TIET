// src/pages/student/WalletPage.jsx
// Phase 5 — SmartRide Wallet: balance, top-up via Razorpay, transaction history

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import {
  loadRazorpayScript,
  openRazorpayCheckout,
  createTopupOrder,
  verifyPayment,
  getWalletBalance,
  getWalletTransactions,
} from '../../services/paymentService';
import './WalletPage.css';

const PRESET_AMOUNTS = [50, 100, 200, 500];

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

const WalletPage = () => {
  const { user }                    = useAuth();
  const [balance,    setBalance]    = useState(0);
  const [txns,       setTxns]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [topping,    setTopping]    = useState(false);
  const [amount,     setAmount]     = useState('');
  const [preset,     setPreset]     = useState(null);

  // ── Load wallet data ──────────────────────────────────────
  const loadWallet = async () => {
    setLoading(true);
    try {
      const [balData, txData] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(20),
      ]);
      setBalance(balData.balance || 0);
      setTxns(txData.transactions || []);
    } catch (err) {
      toast.error('Could not load wallet data.');
    }
    setLoading(false);
  };

  useEffect(() => { loadWallet(); }, []);

  // ── Preset amount selection ───────────────────────────────
  const selectPreset = (val) => {
    setPreset(val);
    setAmount(String(val));
  };

  const handleAmountInput = (val) => {
    setAmount(val);
    setPreset(PRESET_AMOUNTS.includes(Number(val)) ? Number(val) : null);
  };

  // ── Razorpay top-up ───────────────────────────────────────
  const handleTopup = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10 || numAmount > 10000) {
      toast.error('Enter an amount between ₹10 and ₹10,000');
      return;
    }

    setTopping(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.');
        setTopping(false);
        return;
      }

      const orderData = await createTopupOrder(numAmount);

      openRazorpayCheckout(
        { ...orderData, description: `SmartRide Wallet Top-up — ₹${numAmount}` },
        { name: user?.displayName || '', email: user?.email || '' },
        async (payResult) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id:   payResult.razorpay_order_id,
              razorpay_payment_id: payResult.razorpay_payment_id,
              razorpay_signature:  payResult.razorpay_signature,
              type: 'wallet',
            });
            toast.success(`🎉 ₹${numAmount} added to your wallet!`);
            setAmount('');
            setPreset(null);
            await loadWallet(); // refresh balance + txns
          } catch (err) {
            toast.error(err.error || 'Top-up verification failed.');
          }
          setTopping(false);
        },
        (err) => {
          if (err?.code !== 'MODAL_CLOSED') {
            toast.error(err?.description || 'Top-up failed. Try again.');
          }
          setTopping(false);
        }
      );
    } catch (err) {
      toast.error(err.error || 'Could not initiate top-up.');
      setTopping(false);
    }
  };

  return (
    <div className="wallet-page">
      <Navbar />
      <div className="wallet-body">

        {/* ── Hero Balance ────────────────────────────── */}
        <div className="wallet-hero">
          <div className="wallet-hero-top">
            <div className="wallet-hero-icon">👛</div>
            <div>
              <div className="wallet-hero-title">SmartRide Wallet</div>
              <div className="wallet-hero-sub">Your campus ride balance</div>
            </div>
          </div>
          <div className="wallet-bal-label">Available Balance</div>
          {loading ? (
            <div className="wallet-skeleton" style={{ width: '180px', height: '48px' }} />
          ) : (
            <div className="wallet-bal-amount">₹{balance.toFixed(2)}</div>
          )}
          <div className="wallet-bal-caption">Use for rides · Top up anytime via UPI, Cards</div>
        </div>

        {/* ── Quick Actions ───────────────────────────── */}
        <div className="wallet-actions">
          <button className="wallet-action-btn" onClick={() => document.getElementById('topup-section').scrollIntoView({ behavior: 'smooth' })}>
            <span className="wallet-action-icon">⚡</span>
            <span className="wallet-action-label">Top Up</span>
          </button>
          <Link to="/student/history" className="wallet-action-btn" style={{ textDecoration: 'none' }}>
            <span className="wallet-action-icon">📋</span>
            <span className="wallet-action-label">Ride History</span>
          </Link>
          <Link to="/student/book" className="wallet-action-btn" style={{ textDecoration: 'none' }}>
            <span className="wallet-action-icon">🚌</span>
            <span className="wallet-action-label">Book Ride</span>
          </Link>
        </div>

        {/* ── Top-up Section ──────────────────────────── */}
        <div className="wallet-card" id="topup-section">
          <div className="wallet-card-title">Add Money to Wallet</div>

          {/* Preset Amounts */}
          <div className="wallet-presets">
            {PRESET_AMOUNTS.map((p) => (
              <button
                key={p}
                className={`wallet-preset-btn${preset === p ? ' active' : ''}`}
                onClick={() => selectPreset(p)}
              >
                ₹{p}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="wallet-input-wrap">
            <span className="wallet-input-prefix">₹</span>
            <input
              id="wallet-amount-input"
              className="wallet-input"
              type="number"
              min="10"
              max="10000"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => handleAmountInput(e.target.value)}
            />
          </div>

          <button
            className="wallet-topup-btn"
            onClick={handleTopup}
            disabled={topping || !amount}
          >
            {topping
              ? <span className="wallet-spinner" />
              : `Add ₹${amount || '—'} to Wallet`}
          </button>

          <div className="wallet-security">
            🔒 All transactions secured by Razorpay · PCI DSS Level 1 certified
          </div>
        </div>

        {/* ── Transaction History ─────────────────────── */}
        <div className="wallet-card">
          <div className="wallet-card-title">Transaction History</div>

          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="wallet-skeleton" style={{ height: '56px', marginBottom: '0.5rem', borderRadius: '12px' }} />
            ))
          ) : txns.length === 0 ? (
            <div className="wallet-empty">
              <span className="wallet-empty-icon">💳</span>
              No transactions yet. Top up your wallet to get started!
            </div>
          ) : (
            <div className="wallet-tx-list">
              {txns.map((tx) => (
                <div key={tx.id} className="wallet-tx-item">
                  <div className={`wallet-tx-icon ${tx.type}`}>
                    {tx.type === 'credit' ? '⬇️' : '⬆️'}
                  </div>
                  <div className="wallet-tx-info">
                    <div className="wallet-tx-note">{tx.note || (tx.type === 'credit' ? 'Wallet Top-up' : 'Ride Payment')}</div>
                    <div className="wallet-tx-time">{formatDate(tx.createdAt)} · via {tx.method || 'Razorpay'}</div>
                  </div>
                  <div className={`wallet-tx-amount ${tx.type}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center' }}>
          <Link to="/student/dashboard" style={{ fontSize: '0.82rem', color: '#6666a0', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
