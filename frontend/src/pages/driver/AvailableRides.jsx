// src/pages/driver/AvailableRides.jsx
// Phase 3 — Driver's real-time feed of pending rides with Accept + Complete

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { acceptRide as apiAcceptRide, completeRide as apiCompleteRide, cancelRide as apiCancelRide } from '../../services/api';
import {
  subscribeToPendingRides,
  subscribeToDriverRides,
  getRideStatusMeta,
  formatTime,
} from '../../services/rideService';

// ── Status Badge ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const meta = getRideStatusMeta(status);
  return (
    <span style={{
      background: meta.bg, color: meta.color,
      border: `1px solid ${meta.dot}40`,
      borderRadius: '20px', padding: '0.25rem 0.75rem',
      fontSize: '0.78rem', fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: meta.dot,
        animation: ['pending','accepted','ongoing'].includes(status) ? 'pulse 1.5s infinite' : 'none',
      }} />
      {meta.label}
    </span>
  );
};

// ── Pending Ride Card ──────────────────────────────────────
const PendingRideCard = ({ ride, onAccept, accepting }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: '16px', padding: '1.25rem 1.5rem',
    transition: 'all 0.2s', animation: 'fadeUp 0.3s ease',
  }}
  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    {/* Top */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#6666a0' }}>{formatTime(ride.createdAt)}</div>
        <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#555580' }}>ID: {ride.id?.slice(0,12)}…</div>
      </div>
      <StatusBadge status={ride.status} />
    </div>

    {/* Student */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
      <span style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', flexShrink: 0,
      }}>🎓</span>
      <div>
        <div style={{ fontWeight: 700, color: '#d0d0f0', fontSize: '0.9rem' }}>{ride.studentName || 'Student'}</div>
        <div style={{ fontSize: '0.78rem', color: '#6666a0' }}>Student</div>
      </div>
    </div>

    {/* Route */}
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc', flexShrink: 0 }} />
        <span style={{ color: '#d0d0f0', fontSize: '0.88rem' }}>{ride.pickupAddress || 'Pickup'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
        <span style={{ color: '#d0d0f0', fontSize: '0.88rem' }}>{ride.dropAddress || 'Drop'}</span>
      </div>
    </div>

    {/* Fare row */}
    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: '#6666a0', marginBottom: '1rem' }}>
      <span>📏 {ride.distance ?? '—'} km</span>
      <span style={{ color: '#22c55e', fontWeight: 700 }}>💰 ₹{ride.fare ?? '—'}</span>
    </div>

    {/* Accept button */}
    <button
      onClick={() => onAccept(ride.id)}
      disabled={accepting === ride.id}
      style={{
        width: '100%',
        background: accepting === ride.id
          ? 'rgba(34,197,94,0.1)'
          : 'linear-gradient(135deg,#059669,#047857)',
        border: 'none', borderRadius: '12px',
        padding: '0.75rem', color: 'white',
        fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', fontWeight: 700,
        cursor: accepting === ride.id ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: accepting === ride.id ? 0.7 : 1,
      }}
    >
      {accepting === ride.id ? '⏳ Accepting…' : '✅ Accept Ride'}
    </button>
  </div>
);

// ── Active Ride Card (driver's own accepted/ongoing rides) ──
const ActiveRideCard = ({ ride, onComplete, onCancel, processing }) => {
  const isCompleted = ride.status === 'completed';
  const isCancelled = ride.status === 'cancelled';
  const isDone = isCompleted || isCancelled;

  return (
    <div style={{
      background: 'rgba(6,182,212,0.06)',
      border: `1px solid ${isDone ? 'rgba(255,255,255,0.08)' : 'rgba(6,182,212,0.25)'}`,
      borderRadius: '16px', padding: '1.25rem 1.5rem',
      animation: 'fadeUp 0.3s ease',
    }}>
      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#6666a0' }}>{formatTime(ride.createdAt)}</div>
          <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#555580' }}>ID: {ride.id?.slice(0,12)}…</div>
        </div>
        <StatusBadge status={ride.status} />
      </div>

      {/* Route */}
      <div style={{ marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc', flexShrink: 0 }} />
          <span style={{ color: '#d0d0f0', fontSize: '0.88rem' }}>{ride.pickupAddress || 'Pickup'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
          <span style={{ color: '#d0d0f0', fontSize: '0.88rem' }}>{ride.dropAddress || 'Drop'}</span>
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: '#6666a0', marginBottom: isDone ? '0' : '1rem' }}>
        <span>📏 {ride.distance ?? '—'} km</span>
        <span style={{ color: '#22c55e', fontWeight: 700 }}>💰 ₹{ride.fare ?? '—'}</span>
        {ride.studentName && <span>🎓 {ride.studentName}</span>}
      </div>

      {/* Action buttons */}
      {!isDone && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onComplete(ride.id)}
            disabled={processing === ride.id}
            style={{
              flex: 1, minWidth: '140px',
              background: processing === ride.id ? 'rgba(34,197,94,0.1)' : 'linear-gradient(135deg,#059669,#047857)',
              border: 'none', borderRadius: '12px',
              padding: '0.7rem 1rem', color: 'white',
              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700,
              cursor: processing === ride.id ? 'not-allowed' : 'pointer',
              opacity: processing === ride.id ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {processing === ride.id ? '⏳ Processing…' : '🏁 Mark Complete'}
          </button>
          <button
            onClick={() => onCancel(ride.id)}
            disabled={!!processing}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '12px', padding: '0.7rem 1rem',
              color: '#f87171', fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem', fontWeight: 600,
              cursor: processing ? 'not-allowed' : 'pointer',
              opacity: processing ? 0.5 : 1, transition: 'all 0.2s',
            }}
          >
            ✕ Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main AvailableRides Page ───────────────────────────────
const AvailableRides = () => {
  const { user, profile } = useAuth();
  const [pending,    setPending]    = useState([]);
  const [myRides,    setMyRides]    = useState([]);
  const [loadingP,   setLoadingP]   = useState(true);
  const [loadingM,   setLoadingM]   = useState(true);
  const [accepting,  setAccepting]  = useState(null);
  const [processing, setProcessing] = useState(null);
  const [tab,        setTab]        = useState('available'); // available | my-rides

  // Subscribe to pending rides
  useEffect(() => {
    const unsub = subscribeToPendingRides((data) => {
      setPending(data);
      setLoadingP(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to own rides
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDriverRides(user.uid, (data) => {
      setMyRides(data);
      setLoadingM(false);
    });
    return () => unsub();
  }, [user]);

  const handleAccept = async (rideId) => {
    setAccepting(rideId);
    try {
      await apiAcceptRide(rideId);
      toast.success('🚗 Ride accepted! Head to the pickup location.');
      setTab('my-rides');
    } catch (err) {
      toast.error(err?.error || 'Could not accept ride.');
    } finally {
      setAccepting(null);
    }
  };

  const handleComplete = async (rideId) => {
    setProcessing(rideId);
    try {
      await apiCompleteRide(rideId);
      toast.success('🎉 Ride completed! Earnings updated.');
    } catch (err) {
      toast.error(err?.error || 'Could not complete ride.');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (rideId) => {
    setProcessing(rideId);
    try {
      await apiCancelRide(rideId);
      toast('Ride cancelled.', { icon: '❌' });
    } catch {
      toast.error('Could not cancel ride.');
    } finally {
      setProcessing(null);
    }
  };

  const activeMyRides    = myRides.filter((r) => ['accepted','ongoing'].includes(r.status));
  const completedMyRides = myRides.filter((r) => r.status === 'completed');
  const totalEarned      = myRides.filter((r) => r.status === 'completed').reduce((s, r) => s + (r.fare || 0), 0);

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: '100vh', background: 'var(--bg-page)',
        color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', paddingTop: '64px',
      }}>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{
              fontSize: '1.9rem', fontWeight: 800,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: '0.35rem',
            }}>
              📍 Rides
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {profile?.vehicleNumber ? `Vehicle: ${profile.vehicleNumber}` : 'Set your vehicle in Profile'}
            </p>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Pending Nearby',  value: pending.length,       color: '#f59e0b' },
              { label: 'Active Rides',    value: activeMyRides.length, color: '#06b6d4' },
              { label: 'Earnings Today',  value: `₹${totalEarned}`,   color: '#22c55e' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px', padding: '1rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { key: 'available', label: `Available (${pending.length})` },
              { key: 'my-rides',  label: `My Rides (${myRides.length})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: tab === t.key ? 'rgba(184, 100, 80, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${tab === t.key ? 'var(--primary-red)' : 'var(--border-color)'}`,
                  borderRadius: '20px', padding: '0.4rem 1.1rem',
                  color: tab === t.key ? 'var(--primary-red)' : 'var(--text-secondary)',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                  fontWeight: tab === t.key ? 700 : 400, cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Available Rides Tab ────────────────────────────── */}
          {tab === 'available' && (
            <>
              {loadingP ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }}>🔍</div>
                  Looking for rides…
                </div>
              ) : pending.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)', borderRadius: '16px', color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>No pending rides right now.</p>
                  <p style={{ fontSize: '0.85rem' }}>Check back soon — students are booking!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {pending.map((ride) => (
                    <PendingRideCard
                      key={ride.id}
                      ride={ride}
                      onAccept={handleAccept}
                      accepting={accepting}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── My Rides Tab ──────────────────────────────────── */}
          {tab === 'my-rides' && (
            <>
              {loadingM ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6666a0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }}>🚗</div>
                  Loading your rides…
                </div>
              ) : myRides.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', color: '#6666a0',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗂️</div>
                  <p style={{ fontWeight: 600, color: '#a0a0c0' }}>You haven't accepted any rides yet.</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Switch to "Available" to find one!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {myRides.map((ride) => (
                    <ActiveRideCard
                      key={ride.id}
                      ride={ride}
                      onComplete={handleComplete}
                      onCancel={handleCancel}
                      processing={processing}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AvailableRides;
