// src/pages/student/StudentDashboard.jsx
// Phase 5 — Student Dashboard with wallet balance widget + payment quick access

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import NotificationModal from '../../components/common/NotificationModal';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { subscribeToStudentRides, getRideStatusMeta, estimateTripTime } from '../../services/rideService';
import { getWalletBalance, cancelRide as apiCancelRide, getMyRides as apiGetMyRides, getUserNotifications } from '../../services/api';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeRide, setActiveRide] = useState(null);
  const [walletBal,  setWalletBal]  = useState(null);  // null = loading
  const [cancelling, setCancelling] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readNotifIds, setReadNotifIds]   = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Load read notifications from localStorage
  useEffect(() => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(`smartride_read_notifs_${user.uid}`);
      if (stored) {
        setReadNotifIds(JSON.parse(stored));
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchMy = () => {
      apiGetMyRides()
        .then((res) => {
          const active = (res?.rides || []).find((r) => ['pending', 'accepted', 'ongoing'].includes(r.status));
          setActiveRide(active || null);
        })
        .catch(() => {});
    };

    const fetchNotifs = () => {
      getUserNotifications()
        .then((res) => {
          if (res?.notifications) {
            setNotifications(res.notifications);
          }
        })
        .catch(() => {});
    };

    fetchMy();
    fetchNotifs();
    const timer = setInterval(() => {
      fetchMy();
      fetchNotifs();
    }, 3000);

    const unsub = subscribeToStudentRides(user.uid, (rides) => {
      const active = rides.find((r) => ['pending', 'accepted', 'ongoing'].includes(r.status));
      setActiveRide(active || null);
    });

    getWalletBalance().then((d) => setWalletBal(d.balance || 0)).catch(() => setWalletBal(0));

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, [user]);

  const handleMarkRead = (id) => {
    if (!readNotifIds.includes(id)) {
      const updated = [...readNotifIds, id];
      setReadNotifIds(updated);
      if (user) {
        try {
          localStorage.setItem(`smartride_read_notifs_${user.uid}`, JSON.stringify(updated));
        } catch {}
      }
    }
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifIds(allIds);
    if (user) {
      try {
        localStorage.setItem(`smartride_read_notifs_${user.uid}`, JSON.stringify(allIds));
      } catch {}
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !readNotifIds.includes(n.id)).length;

  const handleCancelActiveRide = async (rideId) => {
    if (!rideId) return;
    const confirm = window.confirm('Are you sure you want to cancel your active ride?');
    if (!confirm) return;

    setCancelling(true);
    try {
      await apiCancelRide(rideId);
      toast('Ride cancelled successfully.', { icon: '❌' });
      setActiveRide(null);
    } catch {
      toast.error('Failed to cancel ride.');
    } finally {
      setCancelling(false);
    }
  };

  const meta = activeRide ? getRideStatusMeta(activeRide.status) : null;
  const isPaid = activeRide?.paymentStatus === 'paid';
  const eta = activeRide ? (activeRide.estimatedTime || estimateTripTime(activeRide.distance, activeRide.isCampusInternal)) : '';

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
              border: `1px solid ${meta.dot}50`,
              borderRadius: '16px', padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem', animation: 'fadeSlide 0.4s ease',
              display: 'flex', flexDirection: 'column', gap: '0.85rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', background: meta.dot,
                    animation: 'pulse 1.5s infinite', flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontWeight: 700, color: meta.color, fontSize: '0.98rem' }}>
                      Active Ride — {meta.label}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#c0c0e0', marginTop: '0.15rem' }}>
                      📍 {activeRide.pickupAddress} → 🏁 {activeRide.dropAddress}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link to="/student/book" style={{
                    background: 'rgba(255,255,255,0.08)', border: `1px solid ${meta.dot}50`,
                    borderRadius: '10px', padding: '0.45rem 0.9rem',
                    color: meta.color, fontSize: '0.82rem', fontWeight: 700,
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  }}>
                    Track Ride →
                  </Link>

                  <button
                    onClick={() => handleCancelActiveRide(activeRide.id)}
                    disabled={cancelling}
                    style={{
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '10px', padding: '0.45rem 0.85rem',
                      color: '#f87171', fontSize: '0.82rem', fontWeight: 600,
                      cursor: cancelling ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </div>

              {/* Driver & ETA & Payment Row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.84rem',
              }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    {activeRide.driverName ? (
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>
                        🧑‍✈️ Driver: <strong>{activeRide.driverName}</strong>
                      </span>
                    ) : (
                      <span style={{ color: '#f59e0b' }}>
                        📡 Searching for driver…
                      </span>
                    )}
                  </div>
                  {eta && (
                    <span style={{ color: '#06b6d4', fontWeight: 600 }}>
                      ⏱️ Est. Time: ~{eta}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700,
                    background: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                    color: isPaid ? '#22c55e' : '#f59e0b',
                    border: `1px solid ${isPaid ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}>
                    {isPaid ? '✅ Paid' : `⚠️ Unpaid: ₹${activeRide.fare}`}
                  </span>

                  {!isPaid && (
                    <button
                      onClick={() => navigate(`/student/payment/${activeRide.id}`)}
                      style={{
                        background: 'var(--gradient-primary)', color: 'white', border: 'none',
                        borderRadius: '8px', padding: '0.35rem 0.8rem', fontSize: '0.8rem',
                        fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      💳 Pay Now
                    </button>
                  )}
                </div>
              </div>
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

            {/* Notifications Action Card (Slot 6) */}
            <div
              onClick={() => setShowNotifModal(true)}
              style={{
                background: 'var(--bg-card)',
                border: unreadNotifsCount > 0 ? '1px solid rgba(184, 100, 80, 0.4)' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                boxShadow: unreadNotifsCount > 0 ? '0 0 15px rgba(184, 100, 80, 0.15)' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'var(--primary-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = unreadNotifsCount > 0 ? 'rgba(184, 100, 80, 0.4)' : 'var(--border-color)';
              }}
            >
              {/* Badge on Top Right */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '24px',
                  height: '24px',
                  padding: '0 6px',
                  borderRadius: '12px',
                  background: unreadNotifsCount > 0 ? 'var(--primary-red, #dc2626)' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  boxShadow: unreadNotifsCount > 0 ? '0 0 10px rgba(220, 38, 38, 0.5)' : 'none',
                  animation: unreadNotifsCount > 0 ? 'pulse 2s infinite' : 'none',
                }}
                title={unreadNotifsCount > 0 ? `${unreadNotifsCount} unread notification(s)` : 'No unread notifications'}
              >
                {unreadNotifsCount > 0 ? unreadNotifsCount : notifications.length}
              </div>

              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔔</div>
              <h3 style={{ color: 'var(--primary-red)', fontWeight: 700, marginBottom: '0.25rem' }}>
                Notifications
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {unreadNotifsCount > 0 ? (
                  <span style={{ color: 'var(--primary-red)', fontWeight: 600 }}>
                    {unreadNotifsCount} new announcement{unreadNotifsCount > 1 ? 's' : ''}
                  </span>
                ) : notifications.length > 0 ? (
                  <span>{notifications.length} announcements</span>
                ) : (
                  <span>Campus & admin notices</span>
                )}
              </p>
            </div>
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

      <NotificationModal
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        notifications={notifications}
        readIds={readNotifIds}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
    </>
  );
};

export default StudentDashboard;
