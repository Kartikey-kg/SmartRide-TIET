// src/pages/student/StudentDashboard.jsx
// Phase 5 — Student Dashboard with wallet balance widget + payment quick access

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { subscribeToStudentRides, getRideStatusMeta } from '../../services/rideService';
import { getWalletBalance } from '../../services/api';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [walletBal,  setWalletBal]  = useState(null);  // null = loading

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToStudentRides(user.uid, (rides) => {
      const active = rides.find((r) => ['pending', 'accepted', 'ongoing'].includes(r.status));
      setActiveRide(active || null);
    });
    // Load wallet balance
    getWalletBalance().then((d) => setWalletBal(d.balance || 0)).catch(() => setWalletBal(0));
    return () => unsub();
  }, [user]);

  const meta = activeRide ? getRideStatusMeta(activeRide.status) : null;

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: '100vh', background: 'var(--bg-page)',
        color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', paddingTop: '64px',
      }}>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
          @keyframes fadeSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {/* Welcome header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Good day, {profile?.name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              Welcome back to SmartRideTIET. Where would you like to go?
            </p>
          </div>

          {/* ── Active Ride Banner ─────────────────────────────── */}
          {activeRide && meta && (
            <div style={{
              background: meta.bg,
              border: `1px solid ${meta.dot}40`,
              borderRadius: '16px', padding: '1.1rem 1.5rem',
              marginBottom: '1.5rem', animation: 'fadeSlide 0.4s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%', background: meta.dot,
                  animation: 'pulse 1.5s infinite', flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontWeight: 700, color: meta.color, fontSize: '0.95rem' }}>
                    Active Ride — {meta.label}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#6666a0', marginTop: '0.15rem' }}>
                    {activeRide.pickupAddress} → {activeRide.dropAddress}
                  </div>
                </div>
              </div>
              <Link to="/student/book" style={{
                background: meta.bg, border: `1px solid ${meta.dot}40`,
                borderRadius: '10px', padding: '0.4rem 0.9rem',
                color: meta.color, fontSize: '0.82rem', fontWeight: 700,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Track Ride →
              </Link>
            </div>
          )}

          {/* Quick action cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <Link to="/student/book" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '1.5rem',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚗</div>
                <h3 style={{ color: 'var(--primary-red)', fontWeight: 700, marginBottom: '0.25rem' }}>Book a Ride</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Get to your destination fast</p>
              </div>
            </Link>

            <Link to="/student/history" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '1.5rem',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🕐</div>
                <h3 style={{ color: 'var(--primary-red)', fontWeight: 700, marginBottom: '0.25rem' }}>Ride History</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>View past trips & receipts</p>
              </div>
            </Link>

            <Link to="/student/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '1.5rem',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👤</div>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>My Profile</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage your account</p>
              </div>
            </Link>

            <Link to="/student/campus-map" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '1.5rem',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🗺️</div>
                <h3 style={{ color: 'var(--olive-green)', fontWeight: 700, marginBottom: '0.25rem' }}>Campus Map</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Explore landmarks · Rides ₹10</p>
              </div>
            </Link>

            {/* Phase 5 — Wallet Card */}
            <Link to="/student/wallet" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '1.5rem',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👛</div>
                <h3 style={{ color: 'var(--accent-gold)', fontWeight: 700, marginBottom: '0.25rem' }}>My Wallet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Balance:&nbsp;
                  {walletBal === null
                    ? <span style={{ color: 'var(--text-muted)' }}>Loading…</span>
                    : <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>₹{walletBal.toFixed(2)}</span>
                  }
                </p>
              </div>
            </Link>
          </div>

          {/* Payment Info Banner */}
          <div style={{
            background: 'rgba(184, 100, 80, 0.08)',
            border: '1px solid rgba(184, 100, 80, 0.25)',
            borderRadius: '14px', padding: '1.25rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>💳</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--primary-red)', fontWeight: 700 }}>Secure Digital Payments & Wallet</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Pay for rides via UPI · Cards · Wallet · Instant SmartRide Wallet top-up
              </p>
            </div>
            {walletBal !== null && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Wallet</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-red)' }}>₹{walletBal.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
