// src/pages/driver/AvailableRides.jsx
// Phase 3 & 5 — Driver: Available Requests, Active Current Ride (Mark Complete), and Ride History

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import {
  acceptRide as apiAcceptRide,
  completeRide as apiCompleteRide,
  cancelRide as apiCancelRide,
  confirmRidePayment as apiConfirmPayment,
  getAvailableRides as apiGetAvailableRides,
  getMyRides as apiGetMyRides,
} from '../../services/api';
import {
  subscribeToPendingRides,
  subscribeToDriverRides,
  getRideStatusMeta,
  formatTime,
  estimateTripTime,
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
const PendingRideCard = ({ ride, onAccept, accepting }) => {
  const eta = ride.estimatedTime || estimateTripTime(ride.distance, ride.isCampusInternal);

  return (
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

      {/* Student Details Preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <span style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0,
        }}>🎓</span>
        <div>
          <div style={{ fontWeight: 700, color: '#d0d0f0', fontSize: '0.9rem' }}>
            {ride.studentName || 'Student'}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#8888b0' }}>
            {ride.studentPhone ? `📞 ${ride.studentPhone}` : 'Campus Student'}
          </div>
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

      {/* Distance, ETA, Fare row */}
      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: '#8888b8', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span>📏 {ride.distance ?? '—'} km</span>
        <span>⏱️ Est. Time: ~{eta}</span>
        <span style={{ color: '#22c55e', fontWeight: 700 }}>💰 ₹{ride.fare ?? '—'}</span>
        {ride.isCampusInternal && (
          <span style={{ color: '#22c55e', fontWeight: 600 }}>🏫 Campus ₹10 Flat</span>
        )}
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
};

// ── Active Current Ride Card (With Mark Complete) ──────────
const ActiveRideCard = ({ ride, onComplete, onCancel, onConfirmPayment, processing }) => {
  const isPaid = ride.paymentStatus === 'paid';
  const eta = ride.estimatedTime || estimateTripTime(ride.distance, ride.isCampusInternal);

  return (
    <div style={{
      background: 'rgba(6,182,212,0.06)',
      border: '1px solid rgba(6,182,212,0.3)',
      borderRadius: '16px', padding: '1.5rem',
      animation: 'fadeUp 0.3s ease',
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🚕 Current Active Ride
          </div>
          <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#555580', marginTop: '0.15rem' }}>
            ID: {ride.id}
          </div>
        </div>
        <StatusBadge status={ride.status} />
      </div>

      {/* Student Details Section */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '0.95rem 1.1rem',
        marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.75rem', color: '#8888b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 600 }}>
          🎓 Student Information
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#f0f0ff', fontSize: '1.05rem' }}>
              {ride.studentName || 'Student'}
            </div>
            {ride.studentEmail && (
              <div style={{ fontSize: '0.78rem', color: '#8888b8', marginTop: '0.1rem' }}>
                ✉️ {ride.studentEmail}
              </div>
            )}
          </div>

          {ride.studentPhone ? (
            <a
              href={`tel:${ride.studentPhone}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)',
                color: '#22c55e', borderRadius: '10px', padding: '0.45rem 0.9rem',
                fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none',
              }}
            >
              📞 Call Student ({ride.studentPhone})
            </a>
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#8888b8' }}>📞 No phone provided</span>
          )}
        </div>
      </div>

      {/* Route */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c084fc', flexShrink: 0 }} />
          <span style={{ color: '#d0d0f0', fontSize: '0.92rem' }}>
            <strong>Pickup:</strong> {ride.pickupAddress || 'Pickup'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
          <span style={{ color: '#d0d0f0', fontSize: '0.92rem' }}>
            <strong>Destination:</strong> {ride.dropAddress || 'Drop'}
          </span>
        </div>
      </div>

      {/* Trip Meta: Distance, ETA, Fare */}
      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: '#8888b8', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <span>📏 {ride.distance ?? '—'} km</span>
        <span style={{ color: '#06b6d4', fontWeight: 600 }}>⏱️ Est. Time to Destination: ~{eta}</span>
        <span style={{ color: '#22c55e', fontWeight: 700 }}>💰 Fare: ₹{ride.fare ?? '—'}</span>
      </div>

      {/* Payment Check Section */}
      <div style={{
        background: isPaid ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
        border: `1px solid ${isPaid ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
        borderRadius: '12px',
        padding: '0.9rem 1.1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8888b8', fontWeight: 600 }}>
            Payment Check
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span style={{
              fontWeight: 800,
              color: isPaid ? '#22c55e' : '#f59e0b',
              fontSize: '0.95rem',
            }}>
              {isPaid ? `✅ PAID — ₹${ride.fare}` : `⚠️ UNPAID — ₹${ride.fare}`}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#8888b8' }}>
              {isPaid ? `(${ride.paymentMethod || 'Online'})` : '(Pending)'}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: isPaid ? '#86efac' : '#fde68a', marginTop: '0.2rem' }}>
            {isPaid
              ? 'Student has completed payment online. No cash collection needed.'
              : 'Payment not yet received online. Collect cash from student or wait for online payment.'}
          </div>
        </div>

        {!isPaid && (
          <button
            onClick={() => onConfirmPayment(ride.id)}
            disabled={processing === ride.id}
            style={{
              background: 'rgba(34,197,94,0.2)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#22c55e',
              borderRadius: '10px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: processing === ride.id ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            💵 Confirm Cash Received
          </button>
        )}
      </div>

      {/* Main Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onComplete(ride.id)}
          disabled={processing === ride.id}
          style={{
            flex: 2, minWidth: '180px',
            background: processing === ride.id ? 'rgba(34,197,94,0.1)' : 'linear-gradient(135deg,#059669,#047857)',
            border: 'none', borderRadius: '12px',
            padding: '0.85rem 1.25rem', color: 'white',
            fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontWeight: 700,
            cursor: processing === ride.id ? 'not-allowed' : 'pointer',
            opacity: processing === ride.id ? 0.7 : 1,
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(5,150,105,0.3)',
          }}
        >
          {processing === ride.id ? '⏳ Completing…' : '🏁 Mark Complete Ride'}
        </button>

        <button
          onClick={() => onCancel(ride.id)}
          disabled={!!processing}
          style={{
            flex: 1, minWidth: '110px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '12px', padding: '0.85rem 1rem',
            color: '#f87171', fontFamily: 'Inter, sans-serif',
            fontSize: '0.88rem', fontWeight: 600,
            cursor: processing ? 'not-allowed' : 'pointer',
            opacity: processing ? 0.5 : 1, transition: 'all 0.2s',
          }}
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  );
};

// ── Driver History Card (Completed Rides) ───────────────────
const DriverHistoryCard = ({ ride }) => {
  const isCompleted = ride.status === 'completed';
  const isPaid = ride.paymentStatus === 'paid';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px',
      padding: '1.1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
      animation: 'fadeUp 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.78rem', color: '#8888b8' }}>
          {formatTime(ride.completedAt || ride.createdAt)} · ID: {ride.id?.slice(0, 8)}…
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{
            padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
            background: isCompleted ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: isCompleted ? '#22c55e' : '#f87171',
          }}>
            {isCompleted ? '✓ Completed' : '✕ Cancelled'}
          </span>
          <span style={{
            padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
            background: isPaid ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
            color: isPaid ? '#22c55e' : '#f59e0b',
          }}>
            {isPaid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
      </div>

      <div style={{ fontSize: '0.88rem', color: '#d0d0f0' }}>
        <div>📍 {ride.pickupAddress}</div>
        <div style={{ marginTop: '0.2rem' }}>🏁 {ride.dropAddress}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82rem', color: '#8888b8' }}>
        <span>🎓 {ride.studentName || 'Student'} · {ride.distance ?? '—'} km</span>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#22c55e' }}>+ ₹{ride.fare ?? 0}</span>
      </div>
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
  const [tab,        setTab]        = useState('available'); // 'available' | 'current' | 'history'

  // Subscribe & poll pending rides
  useEffect(() => {
    const fetchPending = () => {
      apiGetAvailableRides()
        .then((res) => {
          if (res?.rides) {
            setPending(res.rides);
            setLoadingP(false);
          }
        })
        .catch((err) => {
          console.warn('apiGetAvailableRides error:', err);
          setLoadingP(false);
        });
    };

    fetchPending();
    const timer = setInterval(fetchPending, 3000);

    const unsub = subscribeToPendingRides(
      (data) => {
        setPending(data);
        setLoadingP(false);
      },
      (err) => {
        console.warn('subscribeToPendingRides listener error:', err);
        setLoadingP(false);
      }
    );

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, []);

  // Subscribe & poll own rides
  useEffect(() => {
    if (!user) return;

    const fetchMy = () => {
      apiGetMyRides()
        .then((res) => {
          if (res?.rides) {
            setMyRides(res.rides);
            setLoadingM(false);
          }
        })
        .catch((err) => {
          console.warn('apiGetMyRides error:', err);
          setLoadingM(false);
        });
    };

    fetchMy();
    const timer = setInterval(fetchMy, 3000);

    const unsub = subscribeToDriverRides(
      user.uid,
      (data) => {
        setMyRides(data);
        setLoadingM(false);
      },
      (err) => {
        console.warn('subscribeToDriverRides listener error:', err);
        setLoadingM(false);
      }
    );

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, [user]);

  // When driver accepts a ride: immediately switch to 'current' ride tab!
  const handleAccept = async (rideId) => {
    setAccepting(rideId);
    try {
      await apiAcceptRide(rideId);
      toast.success('🚗 Ride accepted! Switched to Current Ride.');
      // Immediately remove from pending in local state
      setPending((prev) => prev.filter((r) => r.id !== rideId));
      // Refresh driver's rides from backend immediately
      const myRes = await apiGetMyRides();
      if (myRes?.rides) setMyRides(myRes.rides);
      setTab('current');
    } catch (err) {
      const msg = err?.error || '';
      if (msg.includes('already accepted by you')) {
        setPending((prev) => prev.filter((r) => r.id !== rideId));
        const myRes = await apiGetMyRides();
        if (myRes?.rides) setMyRides(myRes.rides);
        setTab('current');
      } else {
        toast.error(msg || 'Could not accept ride.');
        // Refresh available list from backend
        const avRes = await apiGetAvailableRides();
        if (avRes?.rides) setPending(avRes.rides);
      }
    } finally {
      setAccepting(null);
    }
  };

  // When driver marks ride complete: removes from Current Ride and returns to Available Rides!
  const handleComplete = async (rideId) => {
    setProcessing(rideId);
    try {
      await apiCompleteRide(rideId);
      toast.success('🎉 Ride completed! Returned to Available Rides.');
      // Refresh driver's rides and available rides from backend
      const [myRes, avRes] = await Promise.all([
        apiGetMyRides().catch(() => null),
        apiGetAvailableRides().catch(() => null),
      ]);
      if (myRes?.rides) setMyRides(myRes.rides);
      if (avRes?.rides) setPending(avRes.rides);
      // Return to Available Rides tab!
      setTab('available');
    } catch (err) {
      toast.error(err?.error || 'Could not complete ride.');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (rideId) => {
    const confirm = window.confirm('Are you sure you want to cancel this ride?');
    if (!confirm) return;

    setProcessing(rideId);
    try {
      await apiCancelRide(rideId);
      toast('Ride cancelled. Returned to Available Rides.', { icon: '❌' });
      const [myRes, avRes] = await Promise.all([
        apiGetMyRides().catch(() => null),
        apiGetAvailableRides().catch(() => null),
      ]);
      if (myRes?.rides) setMyRides(myRes.rides);
      if (avRes?.rides) setPending(avRes.rides);
      setTab('available');
    } catch {
      toast.error('Could not cancel ride.');
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirmPayment = async (rideId) => {
    setProcessing(rideId);
    try {
      await apiConfirmPayment(rideId, { paymentMethod: 'cash' });
      toast.success('💵 Cash payment confirmed!');
    } catch (err) {
      toast.error(err?.error || 'Could not update payment status.');
    } finally {
      setProcessing(null);
    }
  };

  // Active / Current accepted rides
  const activeMyRides    = myRides.filter((r) => ['accepted','ongoing'].includes(r.status));
  // Completed / Past rides for History
  const completedMyRides = myRides.filter((r) => ['completed', 'cancelled'].includes(r.status));
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
              📍 Driver Rides & Orders
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {profile?.vehicleNumber ? `Vehicle: ${profile.vehicleNumber} (${profile?.vehicleType || 'Cab'})` : 'Set your vehicle in Profile'}
            </p>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Available Rides',  value: pending.length,          color: '#f59e0b' },
              { label: 'Current Ride',     value: activeMyRides.length,    color: '#06b6d4' },
              { label: 'Total Earnings',   value: `₹${totalEarned}`,       color: '#22c55e' },
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

          {/* ── Tabs: Available, Current Ride, Ride History ── */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { key: 'available', label: `Available (${pending.length})` },
              { key: 'current',   label: `Current Ride (${activeMyRides.length})` },
              { key: 'history',   label: `Ride History (${completedMyRides.length})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: tab === t.key ? 'rgba(184, 100, 80, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${tab === t.key ? 'var(--primary-red)' : 'var(--border-color)'}`,
                  borderRadius: '20px', padding: '0.45rem 1.1rem',
                  color: tab === t.key ? 'var(--primary-red)' : 'var(--text-secondary)',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                  fontWeight: tab === t.key ? 700 : 400, cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── 1. Available Rides Tab ────────────────────────────── */}
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

          {/* ── 2. Current Ride Tab (Go here when accepted, Mark Complete) ── */}
          {tab === 'current' && (
            <>
              {loadingM ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6666a0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }}>🚗</div>
                  Loading current ride…
                </div>
              ) : activeMyRides.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem 1.5rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)', borderRadius: '16px',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚕</div>
                  <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.3rem' }}>
                    No Current Active Ride
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Accept a student ride from Available Rides to start driving.
                  </p>
                  <button
                    onClick={() => setTab('available')}
                    style={{
                      background: 'var(--gradient-primary)', color: 'white', border: 'none',
                      borderRadius: '12px', padding: '0.65rem 1.25rem', fontWeight: 700,
                      cursor: 'pointer', fontSize: '0.88rem',
                    }}
                  >
                    🚗 View Available Rides ({pending.length})
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {activeMyRides.map((ride) => (
                    <ActiveRideCard
                      key={ride.id}
                      ride={ride}
                      onComplete={handleComplete}
                      onCancel={handleCancel}
                      onConfirmPayment={handleConfirmPayment}
                      processing={processing}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── 3. Ride History Tab (Completed Rides Moved Here) ── */}
          {tab === 'history' && (
            <>
              {loadingM ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6666a0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }}>📋</div>
                  Loading history…
                </div>
              ) : completedMyRides.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', color: '#6666a0',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗂️</div>
                  <p style={{ fontWeight: 600, color: '#a0a0c0' }}>No completed rides in history yet.</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Completed rides will automatically appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {completedMyRides.map((ride) => (
                    <DriverHistoryCard key={ride.id} ride={ride} />
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
