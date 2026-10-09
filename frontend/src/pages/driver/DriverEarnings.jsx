// src/pages/driver/DriverEarnings.jsx
// Phase 3 — Driver Earnings Dashboard with ride history

import { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { subscribeToDriverRides, formatTime } from '../../services/rideService';

// ── Stat Card ──────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, bg }) => (
  <div style={{
    background: bg || 'rgba(255,255,255,0.03)',
    border: `1px solid ${color}20`,
    borderRadius: '16px', padding: '1.25rem',
    display: 'flex', alignItems: 'center', gap: '1rem',
    animation: 'fadeUp 0.4s ease',
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: '14px',
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.4rem', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: '#6666a0', marginTop: '0.1rem' }}>{label}</div>
    </div>
  </div>
);

// ── Completed Ride Row ─────────────────────────────────────
const EarningsRow = ({ ride, index }) => (
  <div style={{
    background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
    borderRadius: '10px', padding: '0.85rem 1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '1rem', flexWrap: 'wrap',
    animation: 'fadeUp 0.3s ease',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  }}>
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ fontSize: '0.88rem', color: '#d0d0f0', fontWeight: 500, marginBottom: '0.2rem' }}>
        {ride.pickupAddress} → {ride.dropAddress}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#6666a0' }}>
        {formatTime(ride.completedAt || ride.createdAt)}
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e' }}>+ ₹{ride.fare ?? 0}</div>
      <div style={{ fontSize: '0.75rem', color: '#6666a0' }}>{ride.distance ?? '—'} km</div>
    </div>
  </div>
);

// ── Main DriverEarnings Page ───────────────────────────────
const DriverEarnings = () => {
  const { user, profile } = useAuth();
  const [rides,   setRides]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDriverRides(user.uid, (data) => {
      setRides(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const completed = rides.filter((r) => r.status === 'completed');
  const cancelled = rides.filter((r) => r.status === 'cancelled');
  const totalEarned   = completed.reduce((s, r) => s + (r.fare || 0), 0);
  const totalRides    = completed.length;
  const avgFare       = totalRides > 0 ? Math.round(totalEarned / totalRides) : 0;
  const totalDistance = completed.reduce((s, r) => s + (r.distance || 0), 0);

  // Weekly breakdown (last 7 days)
  const now = Date.now();
  const weekEarnings = completed
    .filter((r) => now - new Date(r.completedAt || r.createdAt).getTime() < 7 * 24 * 3600 * 1000)
    .reduce((s, r) => s + (r.fare || 0), 0);

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: '100vh', background: 'var(--bg-page)',
        color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', paddingTop: '64px',
      }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.9rem', fontWeight: 800,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: '0.35rem',
            }}>
              💰 Earnings
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {profile?.name?.split(' ')[0] || 'Driver'}'s complete earnings breakdown.
            </p>
          </div>

          {/* Big total */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px', padding: '2rem',
            textAlign: 'center', marginBottom: '1.25rem',
            animation: 'fadeUp 0.4s ease',
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Total Lifetime Earnings
            </div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--olive-green)', lineHeight: 1.1 }}>
              ₹{totalEarned}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              from {totalRides} completed ride{totalRides !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
            <StatCard icon="📅" label="This Week"         value={`₹${weekEarnings}`}                  color="#06b6d4" />
            <StatCard icon="📊" label="Avg Fare per Ride" value={`₹${avgFare}`}                       color="#a78bfa" />
            <StatCard icon="🛣️"  label="Total Distance"   value={`${Math.round(totalDistance)} km`}   color="#f59e0b" />
            <StatCard icon="❌" label="Cancelled"          value={cancelled.length}                    color="#ef4444" />
          </div>

          {/* Earnings history */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '18px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '1.1rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Completed Rides</span>
              <span style={{
                background: 'rgba(78, 122, 93, 0.12)', color: 'var(--olive-green)',
                borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.8rem', fontWeight: 700,
              }}>
                {totalRides} rides
              </span>
            </div>

            <div style={{ padding: '0.5rem 0.5rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6666a0' }}>
                  Loading…
                </div>
              ) : completed.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6666a0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                  <p style={{ fontWeight: 600, color: '#a0a0c0', marginBottom: '0.25rem' }}>No completed rides yet.</p>
                  <p style={{ fontSize: '0.85rem' }}>Accept rides from the Available Rides page.</p>
                </div>
              ) : (
                completed.map((ride, i) => (
                  <EarningsRow key={ride.id} ride={ride} index={i} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DriverEarnings;
