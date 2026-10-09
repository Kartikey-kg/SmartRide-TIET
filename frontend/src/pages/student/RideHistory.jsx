// src/pages/student/RideHistory.jsx
// Phase 3 — Student Ride History with real-time Firestore updates

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { cancelRide as apiCancelRide } from '../../services/api';
import {
  subscribeToStudentRides,
  getRideStatusMeta,
  formatTime,
} from '../../services/rideService';

// ── Status Badge ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const meta = getRideStatusMeta(status);
  return (
    <span style={{
      background: meta.bg,
      color: meta.color,
      border: `1px solid ${meta.dot}40`,
      borderRadius: '20px',
      padding: '0.25rem 0.75rem',
      fontSize: '0.78rem',
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: meta.dot,
        animation: ['pending','accepted','ongoing'].includes(status) ? 'pulse 1.5s infinite' : 'none',
      }} />
      {meta.label}
    </span>
  );
};

// ── Ride Card ──────────────────────────────────────────────
const RideCard = ({ ride, onCancel }) => {
  const meta = getRideStatusMeta(ride.status);
  const isActive = ['pending', 'accepted', 'ongoing'].includes(ride.status);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancel(ride.id);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${isActive ? meta.dot + '30' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      transition: 'border-color 0.3s',
      animation: 'fadeUp 0.3s ease',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#6666a0', marginBottom: '0.15rem' }}>
            {formatTime(ride.createdAt)}
          </div>
          <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#555580' }}>
            ID: {ride.id?.slice(0, 12)}…
          </div>
        </div>
        <StatusBadge status={ride.status} />
      </div>

      {/* Route */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc', flexShrink: 0 }} />
          <span style={{ color: '#d0d0f0', fontSize: '0.9rem', fontWeight: 500 }}>{ride.pickupAddress || 'Pickup'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
          <span style={{ color: '#d0d0f0', fontSize: '0.9rem', fontWeight: 500 }}>{ride.dropAddress || 'Drop'}</span>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: '#6666a0', flexWrap: 'wrap' }}>
        <span>🚗 {ride.distance ?? '—'} km</span>
        <span>💰 ₹{ride.fare ?? '—'}</span>
        {ride.driverName && <span>🧑‍✈️ {ride.driverName}</span>}
        {ride.status === 'completed' && ride.completedAt && (
          <span>✅ {formatTime(ride.completedAt)}</span>
        )}
      </div>

      {/* Cancel button (only for active rides) */}
      {isActive && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          style={{
            marginTop: '0.85rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px',
            padding: '0.4rem 0.9rem',
            color: '#f87171',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: cancelling ? 'not-allowed' : 'pointer',
            opacity: cancelling ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {cancelling ? 'Cancelling…' : '✕ Cancel Ride'}
        </button>
      )}
    </div>
  );
};

// ── Main RideHistory Page ──────────────────────────────────
const RideHistory = () => {
  const { user } = useAuth();
  const [rides, setRides]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all'); // all | active | completed

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToStudentRides(user.uid, (data) => {
      setRides(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleCancel = async (rideId) => {
    try {
      await apiCancelRide(rideId);
      toast('Ride cancelled.', { icon: '❌' });
    } catch {
      toast.error('Could not cancel ride.');
    }
  };

  const filtered = rides.filter((r) => {
    if (filter === 'active')    return ['pending','accepted','ongoing'].includes(r.status);
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  const activeCount    = rides.filter((r) => ['pending','accepted','ongoing'].includes(r.status)).length;
  const completedCount = rides.filter((r) => r.status === 'completed').length;
  const totalFare      = rides
    .filter((r) => r.status === 'completed')
    .reduce((s, r) => s + (r.fare || 0), 0);

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif',
        paddingTop: '64px',
      }}>
        <style>{`
          @keyframes pulse {
            0%,100% { opacity:1; transform:scale(1); }
            50%      { opacity:0.6; transform:scale(1.3); }
          }
          @keyframes fadeUp {
            from { opacity:0; transform:translateY(10px); }
            to   { opacity:1; transform:translateY(0); }
          }
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
              🕐 Ride History
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              All your rides, past and present.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Rides',    value: rides.length,    color: '#a78bfa' },
              { label: 'Completed',      value: completedCount,  color: '#22c55e' },
              { label: 'Total Spent',    value: `₹${totalFare}`, color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all',       label: `All (${rides.length})` },
              { key: 'active',    label: `Active (${activeCount})` },
              { key: 'completed', label: `Completed (${completedCount})` },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  background: filter === tab.key ? 'rgba(184, 100, 80, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${filter === tab.key ? 'var(--primary-red)' : 'var(--border-color)'}`,
                  borderRadius: '20px',
                  padding: '0.4rem 1rem',
                  color: filter === tab.key ? 'var(--primary-red)' : 'var(--text-secondary)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: filter === tab.key ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ride list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }}>🚌</div>
              Loading rides…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                {rides.length === 0 ? '🚗' : '🔍'}
              </div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {rides.length === 0 ? 'No rides yet!' : 'No rides in this category.'}
              </p>
              {rides.length === 0 && (
                <Link
                  to="/student/book"
                  style={{
                    display: 'inline-block', marginTop: '0.75rem',
                    background: 'var(--gradient-primary)',
                    color: 'white', textDecoration: 'none',
                    padding: '0.6rem 1.5rem', borderRadius: '10px',
                    fontWeight: 700, fontSize: '0.9rem',
                  }}
                >
                  Book Your First Ride →
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filtered.map((ride) => (
                <RideCard key={ride.id} ride={ride} onCancel={handleCancel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RideHistory;
