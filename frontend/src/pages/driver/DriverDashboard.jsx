// src/pages/driver/DriverDashboard.jsx
// Phase 3 — Driver Dashboard with live active ride banner + earnings

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { Link } from 'react-router-dom';
import { subscribeToDriverRides, getRideStatusMeta } from '../../services/rideService';

const DriverDashboard = () => {
  const { user, profile } = useAuth();
  const [activeRide, setActiveRide]     = useState(null);
  const [todayEarned, setTodayEarned]   = useState(0);
  const [totalRides,  setTotalRides]    = useState(0);

  useEffect(() => {
    if (!user) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const unsub = subscribeToDriverRides(user.uid, (rides) => {
      const active = rides.find((r) => ['accepted','ongoing'].includes(r.status));
      setActiveRide(active || null);
      const completed = rides.filter((r) => r.status === 'completed');
      setTotalRides(completed.length);
      const todayEarnings = completed
        .filter((r) => new Date(r.completedAt || r.createdAt) >= todayStart)
        .reduce((s, r) => s + (r.fare || 0), 0);
      setTodayEarned(todayEarnings);
    });
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

          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Ready to drive, {profile?.name?.split(' ')[0] || 'Driver'}! 🚗
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              Vehicle: {profile?.vehicleNumber || 'Not set'} ({profile?.vehicleType || '—'})
            </p>
          </div>

          {/* Today's stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: "Today's Earnings", value: `₹${todayEarned}`, color: '#22c55e' },
              { label: 'Rides Completed',  value: totalRides,         color: '#06b6d4' },
              { label: 'Total Earned',     value: `₹${profile?.earnings ?? 0}`, color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px', padding: '1rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Active Ride Banner ─────────────────────────────── */}
          {activeRide && meta && (
            <div style={{
              background: meta.bg, border: `1px solid ${meta.dot}40`,
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
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {activeRide.pickupAddress} → {activeRide.dropAddress}
                    {activeRide.studentName && <span style={{ marginLeft: '0.5rem' }}>· 🎓 {activeRide.studentName}</span>}
                  </div>
                </div>
              </div>
              <Link to="/driver/available" style={{
                background: meta.bg, border: `1px solid ${meta.dot}40`,
                borderRadius: '10px', padding: '0.4rem 0.9rem',
                color: meta.color, fontSize: '0.82rem', fontWeight: 700,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Manage Ride →
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <Link to="/driver/available" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '1.5rem',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📍</div>
                <h3 style={{ color: 'var(--primary-red)', fontWeight: 700, marginBottom: '0.25rem' }}>Available Rides</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Accept nearby student requests</p>
              </div>
            </Link>

            <Link to="/driver/earnings" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '1.5rem',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💰</div>
                <h3 style={{ color: 'var(--olive-green)', fontWeight: 700, marginBottom: '0.25rem' }}>Earnings</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>₹{profile?.earnings ?? 0} total earned</p>
              </div>
            </Link>

            <Link to="/driver/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '1.5rem',
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚙️</div>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>My Profile</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Update vehicle & account info</p>
              </div>
            </Link>
          </div>

          {/* Ride Dispatch Banner */}
          <div style={{
            background: 'rgba(184, 100, 80, 0.08)',
            border: '1px solid rgba(184, 100, 80, 0.25)',
            borderRadius: '14px', padding: '1.25rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>🚀</span>
            <div>
              <p style={{ color: 'var(--primary-red)', fontWeight: 700 }}>Real-Time Ride Dispatch</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Accept rides, mark completions, and track your earnings in real-time!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DriverDashboard;
