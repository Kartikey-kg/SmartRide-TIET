// src/pages/student/BookRide.jsx
// Phase 4 — Campus Landmarks + ₹10 campus flat fare + interactive booking

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import {
  bookRide as apiBookRide,
  cancelRide as apiCancelRide,
} from '../../services/api';
import {
  subscribeToRide,
  calcDistance,
  calcFare,
  getRideStatusMeta,
  formatTime,
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

// ── Estimated travel time (rough: 20 km/h inside campus, 40 outside)
const estimateTime = (km, isCampus) => {
  const speed = isCampus ? 15 : 40;
  const mins = Math.round((km / speed) * 60);
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
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
  const { profile } = useAuth();
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
  const [booking,    setBooking]     = useState(false);
  const [activeRide, setActiveRide]  = useState(null);
  const [rideStatus, setRideStatus]  = useState(null);

  const unsubRef = useRef(null);

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

  // ── Subscribe to ride status ──────────────────────────────────
  useEffect(() => {
    if (activeRide) {
      unsubRef.current = subscribeToRide(activeRide, (ride) => {
        setRideStatus(ride);
        if (ride.status === 'completed') {
          toast.success('🎉 Your ride is complete! Have a safe trip.');
        }
        if (ride.status === 'cancelled') {
          toast('Ride was cancelled.', { icon: '❌' });
        }
      });
    }
    return () => { if (unsubRef.current) unsubRef.current(); };
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
      const res = await apiBookRide({
        pickupLocation: { lat: pickupLoc.lat, lng: pickupLoc.lng },
        dropLocation:   { lat: dropLoc.lat,   lng: dropLoc.lng   },
        pickupAddress:  pickupLoc.label,
        dropAddress:    dropLoc.label,
        distance,
        fare,
        isCampusInternal: isCampus,
      });
      toast.success('Ride booked! Redirecting to payment…');
      setActiveRide(res.rideId);
      // Phase 5: redirect to payment page after brief delay
      setTimeout(() => navigate(`/student/payment/${res.rideId}`), 800);
    } catch (err) {
      toast.error(err?.error || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRide) return;
    try {
      await apiCancelRide(activeRide);
      toast('Ride cancelled.', { icon: '❌' });
      setActiveRide(null);
      setRideStatus(null);
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
    if (activeTab === 'All') return loc.isCampus; // show campus only in quick panel
    return loc.isCampus && loc.category === activeTab;
  });

  // ── Render ride status banner ─────────────────────────────────
  const renderStatusBanner = () => {
    if (!rideStatus) return null;
    const meta = getRideStatusMeta(rideStatus.status);
    const isDone = ['completed', 'cancelled'].includes(rideStatus.status);

    return (
      <div className="booking-status-banner" style={{ background: meta.bg, border: `1px solid ${meta.dot}40` }}>
        <div className="booking-status-top">
          <span className="booking-status-dot" style={{ background: meta.dot }} />
          <span className="booking-status-label" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#a0a0c0', marginBottom: '0.5rem' }}>
          <span>📍 {rideStatus.pickupAddress}</span>
          <span style={{ margin: '0 0.5rem' }}>→</span>
          <span>🏁 {rideStatus.dropAddress}</span>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#6666a0', flexWrap: 'wrap' }}>
          <span>🚗 {rideStatus.distance} km</span>
          <span>💰 ₹{rideStatus.fare}</span>
          {rideStatus.isCampusInternal && (
            <span style={{ color: '#22c55e', fontWeight: 700 }}>🏫 Campus Flat Rate</span>
          )}
          <span>🕐 {formatTime(rideStatus.createdAt)}</span>
        </div>

        {rideStatus.driverName && (
          <div className="driver-info-card">
            <div className="driver-avatar">🧑‍✈️</div>
            <div>
              <div className="driver-info-name">{rideStatus.driverName}</div>
              <div className="driver-info-sub">Your driver is on the way!</div>
            </div>
          </div>
        )}

        {!isDone && (
          <button className="booking-cancel-btn" onClick={handleCancel}>
            ✕ Cancel Ride
          </button>
        )}

        {isDone && (
          <button
            className="book-btn"
            style={{ marginTop: '0.75rem' }}
            onClick={handleBookAnother}
          >
            <span>+ Book Another Ride</span>
          </button>
        )}
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
            <h1>📍 Book a Ride</h1>
            <p>Hello {profile?.name?.split(' ')[0] || 'Student'}! Where are you headed today?</p>
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

          {/* Live status banner */}
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
              💡 <strong style={{ color: '#c084fc' }}>How it works:</strong> Select a pickup and drop landmark, confirm booking, and a nearby driver will accept your ride. Campus rides are always ₹10 flat.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookRide;
