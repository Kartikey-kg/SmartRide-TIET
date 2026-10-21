// src/pages/student/BookRide.jsx
// Phase 4 & 5 — Campus Landmarks + Flat Fare + Live Driver Tracking & Payment Flexibility

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import {
  bookRide as apiBookRide,
  cancelRide as apiCancelRide,
  getMyRides as apiGetMyRides,
  getRideById as apiGetRideById,
} from '../../services/api';
import {
  subscribeToRide,
  subscribeToStudentRides,
  calcDistance,
  calcFare,
  getRideStatusMeta,
  formatTime,
  estimateTripTime,
} from '../../services/rideService';
import {
  ALL_LOCATIONS,
  CAMPUS_LOCATIONS,
  OFFCAMPUS_LOCATIONS,
  isCampusInternalTrip,
  CAMPUS_FLAT_FARE,
  CATEGORY_COLORS,
} from '../../data/locations';
import './BookRide.css';

// ── Suggestion filter ─────────────────────────────────────────────
const getSuggestions = (text) => {
  if (!text || text.length < 2) return [];
  const lower = text.toLowerCase();
  return ALL_LOCATIONS.filter((loc) =>
    loc.label.toLowerCase().includes(lower)
  ).slice(0, 8);
};

// ── Estimated travel time (rough: 15 km/h inside campus, 35 outside)
const estimateTime = (km, isCampus) => {
  return estimateTripTime(km, isCampus);
};

// ── Location Input Component ──────────────────────────────────────
const LocationInput = ({ label, dotClass, icon, value, onChange, placeholder, suggestions, onSelect }) => (
  <div className="location-input-wrapper">
    <div className="location-input-label">
      <span className={`location-dot ${dotClass}`} />
      {label}
    </div>
    <div style={{ position: 'relative' }}>
      <span className="location-input-icon">{icon}</span>
      <input
        className="location-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((s) => (
            <div key={s.label} className="suggestion-item" onClick={() => onSelect(s)}>
              <span className="suggestion-icon">{s.emoji || '📍'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.label}</div>
                {s.description && (
                  <div style={{ fontSize: '0.75rem', color: '#6666a0', marginTop: '1px' }}>{s.description}</div>
                )}
              </div>
              {s.isCampus && (
                <span style={{
                  fontSize: '0.65rem', background: 'rgba(34,197,94,0.15)',
                  color: '#22c55e', borderRadius: '6px', padding: '2px 6px',
                  fontWeight: 700, whiteSpace: 'nowrap', alignSelf: 'center',
                }}>CAMPUS</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ── Quick Category Tabs ───────────────────────────────────────────
const QUICK_CATEGORIES = ['All', 'Gates', 'Academic', 'Hostels', 'Food', 'Sports', 'Research'];

// ── Main BookRide Page ────────────────────────────────────────────
const BookRide = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Location state
  const [pickupText,  setPickupText]  = useState('');
  const [dropText,    setDropText]    = useState('');
  const [pickupLoc,   setPickupLoc]   = useState(null);
  const [dropLoc,     setDropLoc]     = useState(null);
  const [pickupSugg,  setPickupSugg]  = useState([]);
  const [dropSugg,    setDropSugg]    = useState([]);

  // Quick loc tabs
  const [activeTab,   setActiveTab]   = useState('All');

  // Fare state
  const [distance,    setDistance]    = useState(null);
  const [fare,        setFare]        = useState(null);
  const [isCampus,    setIsCampus]    = useState(false);

  // Booking state
  const [booking,     setBooking]     = useState(false);
  const [activeRide,  setActiveRide]  = useState(null);
  const [rideStatus,  setRideStatus]  = useState(null);

  const unsubRef = useRef(null);

  // ── Auto-load and poll ongoing active ride for current student ─────
  useEffect(() => {
    if (!user?.uid) return;

    const fetchMy = () => {
      apiGetMyRides()
        .then((res) => {
          const rides = res?.rides || [];
          const active = rides.find((r) => ['pending', 'accepted', 'ongoing'].includes(r.status));
          if (active) {
            setActiveRide(active.id);
            setRideStatus(active);
          } else if (activeRide) {
            // Check if activeRide has now completed or cancelled
            const current = rides.find((r) => r.id === activeRide);
            if (current) setRideStatus(current);
          }
        })
        .catch((err) => console.warn('apiGetMyRides error:', err));
    };

    fetchMy();
    const timer = setInterval(fetchMy, 3000);

    const unsub = subscribeToStudentRides(
      user.uid,
      (rides) => {
        const active = rides.find((r) => ['pending', 'accepted', 'ongoing'].includes(r.status));
        if (active) {
          setActiveRide(active.id);
          setRideStatus(active);
        }
      },
      (err) => console.warn('subscribeToStudentRides error:', err)
    );

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, [user, activeRide]);

  // ── Recalculate fare when both locations set ──────────────────
  useEffect(() => {
    if (pickupLoc && dropLoc) {
      const dist = calcDistance(pickupLoc.lat, pickupLoc.lng, dropLoc.lat, dropLoc.lng);
      const campusTrip = isCampusInternalTrip(pickupLoc, dropLoc);
      setDistance(Math.round(dist * 10) / 10);
      setFare(calcFare(dist, campusTrip));
      setIsCampus(campusTrip);
    } else {
      setDistance(null);
      setFare(null);
      setIsCampus(false);
    }
  }, [pickupLoc, dropLoc]);

  // ── Subscribe and poll specific ride status ───────────────────
  useEffect(() => {
    if (activeRide) {
      const pollSpecificRide = () => {
        apiGetRideById(activeRide)
          .then((res) => {
            if (res?.ride) {
              setRideStatus((prev) => {
                if (prev?.status !== res.ride.status && res.ride.status === 'completed') {
                  toast.success('🎉 Your ride is complete! Saved to Ride History.');
                }
                return res.ride;
              });
            }
          })
          .catch((err) => console.warn('apiGetRideById error:', err));
      };

      pollSpecificRide();
      const specificTimer = setInterval(pollSpecificRide, 3000);

      unsubRef.current = subscribeToRide(
        activeRide,
        (ride) => {
          setRideStatus(ride);
          if (ride.status === 'completed') {
            toast.success('🎉 Your ride is complete! Saved to Ride History.');
          }
          if (ride.status === 'cancelled') {
            toast('Ride was cancelled.', { icon: '❌' });
          }
        },
        (err) => console.warn('subscribeToRide error:', err)
      );

      return () => {
        clearInterval(specificTimer);
        if (unsubRef.current) unsubRef.current();
      };
    }
  }, [activeRide]);

  // ── Handlers ─────────────────────────────────────────────────
  const handlePickupChange = (text) => {
    setPickupText(text);
    setPickupLoc(null);
    setPickupSugg(getSuggestions(text));
  };

  const handleDropChange = (text) => {
    setDropText(text);
    setDropLoc(null);
    setDropSugg(getSuggestions(text));
  };

  const handleSelectPickup = (loc) => {
    setPickupLoc(loc);
    setPickupText(loc.label);
    setPickupSugg([]);
  };

  const handleSelectDrop = (loc) => {
    setDropLoc(loc);
    setDropText(loc.label);
    setDropSugg([]);
  };

  const handleQuickSelect = (loc) => {
    if (!pickupLoc) { handleSelectPickup(loc); }
    else if (!dropLoc && loc.label !== pickupLoc.label) { handleSelectDrop(loc); }
    else if (loc.label !== pickupLoc?.label) { handleSelectDrop(loc); }
  };

  const handleBook = async () => {
    if (!pickupLoc || !dropLoc) {
      toast.error('Please select both pickup and drop locations.');
      return;
    }
    if (pickupLoc.label === dropLoc.label) {
      toast.error('Pickup and drop cannot be the same location.');
      return;
    }

    setBooking(true);
    try {
      const tripEstimate = estimateTripTime(distance, isCampus);
      const res = await apiBookRide({
        pickupLocation: { lat: pickupLoc.lat, lng: pickupLoc.lng },
        dropLocation:   { lat: dropLoc.lat,   lng: dropLoc.lng   },
        pickupAddress:  pickupLoc.label,
        dropAddress:    dropLoc.label,
        distance,
        fare,
        isCampusInternal: isCampus,
        estimatedTime: tripEstimate,
        studentPhone: profile?.phone || '',
        studentName: profile?.name || '',
      });
      toast.success('🚗 Ride requested! Searching for nearby drivers…');
      
      const newRideObj = res.ride || {
        id: res.rideId,
        pickupAddress: pickupLoc.label,
        dropAddress: dropLoc.label,
        distance,
        fare,
        isCampusInternal: isCampus,
        estimatedTime: tripEstimate,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString(),
      };

      setActiveRide(res.rideId);
      setRideStatus(newRideObj);
    } catch (err) {
      toast.error(err?.error || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRide) return;
    const confirm = window.confirm('Are you sure you want to cancel this ride?');
    if (!confirm) return;

    try {
      await apiCancelRide(activeRide);
      toast('Ride cancelled. Returning to dashboard…', { icon: '❌' });
      setActiveRide(null);
      setRideStatus(null);
      navigate('/student/dashboard');
    } catch {
      toast.error('Could not cancel ride.');
    }
  };

  const handleBookAnother = () => {
    setActiveRide(null);
    setRideStatus(null);
    setPickupText('');
    setDropText('');
    setPickupLoc(null);
    setDropLoc(null);
  };

  // ── Quick loc filtered list ───────────────────────────────────
  const filteredLocations = ALL_LOCATIONS.filter((loc) => {
    if (activeTab === 'All') return loc.isCampus;
    return loc.isCampus && loc.category === activeTab;
  });

  // ── Render ride status banner ─────────────────────────────────
  const renderStatusBanner = () => {
    if (!rideStatus) {
      return (
        <div className="book-ride-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }}>🚗</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
            Loading Ride Details…
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Connecting to server…
          </div>
        </div>
      );
    }

    const meta = getRideStatusMeta(rideStatus.status);
    const hasDriver = !!rideStatus.driverName;
    const isPaid = rideStatus.paymentStatus === 'paid';
    const etaText = rideStatus.estimatedTime || estimateTripTime(rideStatus.distance, rideStatus.isCampusInternal);

    // ── When completed: show clean completion card with direct history link ──
    if (rideStatus.status === 'completed') {
      return (
        <div className="book-ride-card" style={{
          textAlign: 'center', padding: '2.5rem 1.5rem',
          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '16px', animation: 'fadeSlideIn 0.3s ease',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
          <h2 style={{ color: '#22c55e', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Ride Completed!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 1.25rem' }}>
            Your trip from <strong>{rideStatus.pickupAddress}</strong> to <strong>{rideStatus.dropAddress}</strong> has ended and is now saved in your Ride History.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
            borderRadius: '12px', padding: '0.85rem 1.25rem', display: 'inline-flex',
            gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.88rem', flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <span>💰 Fare: <strong>₹{rideStatus.fare}</strong></span>
            <span>🚗 Distance: <strong>{rideStatus.distance} km</strong></span>
            {rideStatus.driverName && <span>🧑‍✈️ Driver: <strong>{rideStatus.driverName}</strong></span>}
            <span>💳 Payment: <strong>{isPaid ? 'Paid' : 'Unpaid'}</strong></span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              className="book-btn"
              style={{ width: 'auto', padding: '0.75rem 1.5rem', marginTop: 0 }}
              onClick={handleBookAnother}
            >
              <span>🚗 Book a New Ride</span>
            </button>

            <Link
              to="/student/history"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', borderRadius: '12px', padding: '0.75rem 1.25rem',
                fontSize: '0.92rem', fontWeight: 700, textDecoration: 'none',
              }}
            >
              📋 View in Ride History →
            </Link>
          </div>
        </div>
      );
    }

    // ── When cancelled: show cancelled card with reset option ──
    if (rideStatus.status === 'cancelled') {
      return (
        <div className="book-ride-card" style={{
          textAlign: 'center', padding: '2rem 1.5rem',
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '16px', animation: 'fadeSlideIn 0.3s ease',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>❌</div>
          <h2 style={{ color: '#f87171', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Ride Cancelled
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            This ride was cancelled and archived into your Ride History.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              className="book-btn"
              style={{ width: 'auto', padding: '0.65rem 1.25rem', marginTop: 0 }}
              onClick={handleBookAnother}
            >
              <span>🚗 Book Another Ride</span>
            </button>
            <Link
              to="/student/history"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', borderRadius: '12px', padding: '0.65rem 1.25rem',
                fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none',
              }}
            >
              📋 View History →
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="booking-status-banner" style={{ background: meta.bg, border: `1px solid ${meta.dot}40` }}>
        <div className="booking-status-top">
          <span className="booking-status-dot" style={{ background: meta.dot }} />
          <span className="booking-status-label" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="booking-status-id">ID: {rideStatus.id?.slice(0, 8)}…</span>
        </div>

        {/* Route Details */}
        <div style={{ fontSize: '0.9rem', color: '#e0e0ff', marginBottom: '0.75rem', lineHeight: '1.5' }}>
          <div>📍 <strong>Pickup:</strong> {rideStatus.pickupAddress}</div>
          <div style={{ marginTop: '0.2rem' }}>🏁 <strong>Destination:</strong> {rideStatus.dropAddress}</div>
        </div>

        {/* Metrics: Distance, ETA, Fare */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#8888b8', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <span>🚗 {rideStatus.distance} km</span>
          <span className="ride-eta-badge">⏱️ Est. Time: ~{etaText}</span>
          <span style={{ fontWeight: 700, color: '#22c55e' }}>💰 ₹{rideStatus.fare}</span>
          {rideStatus.isCampusInternal && (
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.78rem' }}>🏫 Campus Flat Rate</span>
          )}
          <span>🕐 {formatTime(rideStatus.createdAt)}</span>
        </div>

        {/* Driver Section: Which driver accepted or waiting */}
        {rideStatus.status === 'pending' && (
          <div className="waiting-driver-box">
            <div className="waiting-driver-radar">📡</div>
            <div className="waiting-driver-title">Waiting for a driver to accept…</div>
            <div className="waiting-driver-desc">
              Your ride request has been dispatched. As soon as a nearby campus driver accepts, you will see their vehicle & contact details right here.
            </div>
          </div>
        )}

        {hasDriver && (
          <div className="driver-info-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="driver-detail-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="driver-avatar">🧑‍✈️</div>
                <div>
                  <div className="driver-info-name" style={{ fontSize: '1.05rem' }}>
                    {rideStatus.driverName} (Accepted)
                  </div>
                  <div className="driver-info-sub">
                    🚗 {rideStatus.driverVehicleNumber || 'Cab'} · {rideStatus.driverVehicleType || 'Standard Vehicle'}
                  </div>
                </div>
              </div>
              {rideStatus.driverPhone && (
                <a href={`tel:${rideStatus.driverPhone}`} className="driver-call-btn">
                  📞 Call ({rideStatus.driverPhone})
                </a>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#22c55e', marginTop: '0.4rem', fontWeight: 600 }}>
              ✓ Driver accepted! On the way to pick you up.
            </div>
          </div>
        )}

        {/* Payment Section: Show before payment, status, pay now */}
        <div className="ride-payment-card">
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Payment Details
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
              <span className={`payment-status-badge ${isPaid ? 'paid' : 'unpaid'}`}>
                {isPaid ? '✅ Paid' : '⚠️ Payment Pending'}
              </span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{rideStatus.fare}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8888b8', marginTop: '0.2rem' }}>
              {isPaid
                ? `Paid via ${rideStatus.paymentMethod || 'Online'}`
                : 'You can pay online now via Razorpay / Wallet or upon destination arrival.'}
            </div>
          </div>

          {!isPaid && (
            <button
              className="pay-now-action-btn"
              onClick={() => navigate(`/student/payment/${rideStatus.id}`)}
            >
              💳 Pay ₹{rideStatus.fare} Now →
            </button>
          )}
        </div>

        {/* Actions: Cancel at any time */}
        <div className="booking-actions-row">
          <button className="booking-cancel-btn" onClick={handleCancel}>
            ✕ Cancel Ride
          </button>
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="book-ride-page">
        <div className="book-ride-container">

          {/* Header */}
          <div className="book-ride-header">
            <h1>📍 {activeRide ? 'Ride Details & Status' : 'Book a Ride'}</h1>
            <p>
              {activeRide
                ? 'Track your ride in real time. Driver and payment information are shown below.'
                : `Hello ${profile?.name?.split(' ')[0] || 'Student'}! Where are you headed today?`}
            </p>
          </div>

          {/* Campus fare notice */}
          {!activeRide && (
            <div style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '12px',
              padding: '0.75rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#86efac',
            }}>
              <span style={{ fontSize: '1.3rem' }}>🏫</span>
              <div>
                <strong style={{ color: '#22c55e' }}>Campus Rides — Flat ₹{CAMPUS_FLAT_FARE}</strong>
                <span style={{ color: '#6666a0', marginLeft: '0.5rem' }}>
                  Any ride between two TIET campus landmarks costs just ₹10.
                </span>
                <Link to="/student/campus-map" style={{ color: '#22c55e', marginLeft: '0.75rem', fontWeight: 700, textDecoration: 'none' }}>
                  View Campus Map →
                </Link>
              </div>
            </div>
          )}

          {/* Quick locations panel */}
          {!activeRide && (
            <div className="quick-locations book-ride-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="quick-locations-title">⚡ TIET Campus Landmarks</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {QUICK_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        border: '1px solid',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: activeTab === cat ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                        borderColor: activeTab === cat ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)',
                        color: activeTab === cat ? '#c084fc' : '#8888b0',
                      }}
                    >{cat}</button>
                  ))}
                </div>
              </div>
              <div className="quick-locations-grid" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {filteredLocations.map((loc) => {
                  const catStyle = CATEGORY_COLORS[loc.category] || {};
                  return (
                    <button
                      key={loc.label}
                      className="quick-loc-chip"
                      onClick={() => handleQuickSelect(loc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: catStyle.bg,
                        borderColor: catStyle.color ? `${catStyle.color}40` : undefined,
                        color: catStyle.color,
                      }}
                      title={loc.description}
                    >
                      <span>{loc.emoji}</span>
                      <span style={{ fontSize: '0.78rem' }}>{loc.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#444470', marginTop: '0.6rem' }}>
                Click a landmark to set as pickup, click another to set as drop.
              </div>
            </div>
          )}

          {/* Booking form */}
          {!activeRide && (
            <div className="book-ride-card">
              <div className="location-section">
                <LocationInput
                  label="Pickup Location"
                  dotClass="dot-pickup"
                  icon="🟣"
                  value={pickupText}
                  onChange={handlePickupChange}
                  placeholder="Search campus landmark or Patiala location…"
                  suggestions={pickupSugg}
                  onSelect={handleSelectPickup}
                />
                <div style={{ position: 'relative', height: '0' }}>
                  <div className="location-connector" style={{ top: '-0.5rem' }} />
                </div>
                <LocationInput
                  label="Drop Location"
                  dotClass="dot-drop"
                  icon="🔵"
                  value={dropText}
                  onChange={handleDropChange}
                  placeholder="Search campus landmark or Patiala location…"
                  suggestions={dropSugg}
                  onSelect={handleSelectDrop}
                />
              </div>

              {/* Fare summary */}
              {distance !== null && fare !== null && (
                <div className="fare-card" style={{
                  borderColor: isCampus ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.2)',
                }}>
                  <div className="fare-item">
                    <div className="fare-item-label">Distance</div>
                    <div className="fare-item-value fare-dist">{distance} km</div>
                  </div>
                  <div className="fare-divider" />
                  <div className="fare-item">
                    <div className="fare-item-label">Est. Time</div>
                    <div className="fare-item-value fare-time">{estimateTime(distance, isCampus)}</div>
                  </div>
                  <div className="fare-divider" />
                  <div className="fare-item">
                    <div className="fare-item-label">
                      {isCampus ? '🏫 Campus Fare' : 'Estimated Fare'}
                    </div>
                    <div className="fare-item-value" style={{ color: isCampus ? '#22c55e' : '#a78bfa', fontSize: '1.3rem', fontWeight: 800 }}>
                      ₹{fare}
                      {isCampus && <span style={{ fontSize: '0.7rem', marginLeft: '0.4rem', color: '#6666a0', fontWeight: 500 }}>flat rate</span>}
                    </div>
                  </div>
                </div>
              )}

              <button
                className="book-btn"
                onClick={handleBook}
                disabled={booking || !pickupLoc || !dropLoc}
                id="book-ride-btn"
              >
                <span>
                  {booking ? '⏳ Booking…' : '🚗 Confirm Booking'}
                </span>
              </button>
            </div>
          )}

          {/* Live status banner / Active ride screen */}
          {activeRide && renderStatusBanner()}

          {/* Info box */}
          {!activeRide && (
            <div style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              fontSize: '0.85rem',
              color: '#8888b0',
              marginTop: '1rem',
              lineHeight: 1.6,
            }}>
              💡 <strong style={{ color: '#c084fc' }}>How it works:</strong> Select a pickup and drop landmark, confirm booking, and a nearby driver will accept your ride. Campus rides are always ₹10 flat. You can cancel at any time and choose when to pay.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookRide;
