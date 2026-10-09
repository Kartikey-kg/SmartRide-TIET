// src/pages/admin/AdminRides.jsx
// Phase 4 — Admin: All Rides Management (view, filter by status, search, cancel)

import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/common/AdminSidebar';
import { getAllRides } from '../../services/api';
import { getRideStatusMeta, formatTime } from '../../services/rideService';
import toast from 'react-hot-toast';
import './Admin.css';

const STATUS_FILTERS = [
  { key: 'all',       label: 'All',       icon: '📋' },
  { key: 'pending',   label: 'Pending',   icon: '⏳' },
  { key: 'accepted',  label: 'Accepted',  icon: '🤝' },
  { key: 'ongoing',   label: 'Ongoing',   icon: '🚕' },
  { key: 'completed', label: 'Completed', icon: '✅' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
];

// ── Ride Detail Card ───────────────────────────────────────────
const RideCard = ({ ride, index }) => {
  const meta = getRideStatusMeta(ride.status);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="ride-card"
      style={{ animationDelay: `${index * 40}ms`, borderColor: `${meta.dot}22` }}
    >
      {/* Header row */}
      <div className="ride-card-header" onClick={() => setExpanded(e => !e)} style={{ cursor: 'pointer' }}>
        <div className="ride-card-left">
          <span
            className="ride-status-dot"
            style={{ background: meta.dot, boxShadow: ride.status === 'pending' || ride.status === 'ongoing' ? `0 0 8px ${meta.dot}` : 'none' }}
          />
          <div>
            <div className="ride-card-route">
              {ride.pickupAddress || 'Unknown pickup'} → {ride.dropAddress || 'Unknown drop'}
            </div>
            <div className="ride-card-sub">
              🎓 {ride.studentName || 'Student'} · {formatTime(ride.createdAt)}
            </div>
          </div>
        </div>
        <div className="ride-card-right">
          <span className="ride-status-pill" style={{ background: meta.bg, color: meta.color, borderColor: `${meta.dot}35` }}>
            {meta.label}
          </span>
          <div className="ride-card-fare">₹{ride.fare ?? 0}</div>
          <span className="ride-card-toggle">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="ride-card-details">
          <div className="ride-detail-grid">
            <div className="ride-detail-item">
              <span className="detail-label">Ride ID</span>
              <span className="detail-value" style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{ride.id}</span>
            </div>
            <div className="ride-detail-item">
              <span className="detail-label">Distance</span>
              <span className="detail-value">{ride.distance ? `${ride.distance.toFixed(2)} km` : '—'}</span>
            </div>
            <div className="ride-detail-item">
              <span className="detail-label">Driver</span>
              <span className="detail-value">{ride.driverName || 'Unassigned'}</span>
            </div>
            <div className="ride-detail-item">
              <span className="detail-label">Payment</span>
              <span className="detail-value" style={{ color: ride.paymentStatus === 'paid' ? '#22c55e' : '#f59e0b' }}>
                {ride.paymentStatus || 'unpaid'}
              </span>
            </div>
            {ride.acceptedAt && (
              <div className="ride-detail-item">
                <span className="detail-label">Accepted At</span>
                <span className="detail-value">{formatTime(ride.acceptedAt)}</span>
              </div>
            )}
            {ride.completedAt && (
              <div className="ride-detail-item">
                <span className="detail-label">Completed At</span>
                <span className="detail-value">{formatTime(ride.completedAt)}</span>
              </div>
            )}
            {ride.cancelledAt && (
              <div className="ride-detail-item">
                <span className="detail-label">Cancelled At</span>
                <span className="detail-value">{formatTime(ride.cancelledAt)}</span>
              </div>
            )}
          </div>

          {/* Pickup / Drop coords */}
          {ride.pickupLocation && (
            <div className="ride-coords">
              <span>📍 Pickup: {ride.pickupLocation.lat?.toFixed(5)}, {ride.pickupLocation.lng?.toFixed(5)}</span>
              <span>🏁 Drop: {ride.dropLocation?.lat?.toFixed(5)}, {ride.dropLocation?.lng?.toFixed(5)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Summary Stats Bar ──────────────────────────────────────────
const StatsBar = ({ rides }) => {
  const total     = rides.length;
  const completed = rides.filter(r => r.status === 'completed').length;
  const revenue   = rides.filter(r => r.status === 'completed').reduce((s, r) => s + (r.fare || 0), 0);
  const pending   = rides.filter(r => r.status === 'pending').length;

  return (
    <div className="rides-stats-bar">
      {[
        { label: 'Total Rides',  value: total,       color: '#d0d0f0' },
        { label: 'Completed',    value: completed,   color: '#22c55e' },
        { label: 'Revenue',      value: `₹${revenue}`,  color: '#f59e0b' },
        { label: 'Pending',      value: pending,     color: '#f59e0b' },
      ].map(s => (
        <div key={s.label} className="rides-stats-item">
          <div className="rides-stats-value" style={{ color: s.color }}>{s.value}</div>
          <div className="rides-stats-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────
const AdminRides = () => {
  const [rides, setRides]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(0);
  const PER_PAGE = 15;

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filter === 'all' ? undefined : filter;
      const res = await getAllRides(statusParam);
      setRides(res.rides || []);
      setPage(0);
    } catch (e) {
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const searchFiltered = rides.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.pickupAddress || '').toLowerCase().includes(q) ||
      (r.dropAddress   || '').toLowerCase().includes(q) ||
      (r.studentName   || '').toLowerCase().includes(q) ||
      (r.driverName    || '').toLowerCase().includes(q) ||
      (r.id            || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(searchFiltered.length / PER_PAGE);
  const paginated  = searchFiltered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page admin-with-sidebar" style={{ flex: 1, paddingTop: '0' }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div>
              <h1 className="admin-title">All Rides <span>🚕</span></h1>
              <p className="admin-subtitle">Browse, search, and inspect every ride on the platform</p>
            </div>
            <button className="admin-refresh-btn" onClick={fetchRides}>↻ Refresh</button>
          </div>

          {/* Stats bar */}
          <StatsBar rides={rides} />

          {/* Controls */}
          <div className="admin-controls">
            <input
              id="rides-search"
              type="text"
              className="admin-search"
              placeholder="🔍  Search by location, student, driver or ride ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
            <div className="admin-filter-tabs rides-tabs">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`filter-tab${filter === f.key ? ' active' : ''}`}
                  onClick={() => { setFilter(f.key); setPage(0); }}
                >
                  {f.icon} {f.label}
                  <span className="filter-count">
                    {f.key === 'all' ? rides.length : rides.filter(r => r.status === f.key).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Rides */}
          {loading ? (
            <div className="admin-loading-inline">
              <div className="admin-spinner" />
              <p>Loading rides…</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="admin-empty">No rides match your filters.</div>
          ) : (
            <>
              <div className="rides-list-wrap">
                {paginated.map((ride, i) => (
                  <RideCard key={ride.id} ride={ride} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    ← Prev
                  </button>
                  <span className="page-info">Page {page + 1} of {totalPages} · {searchFiltered.length} rides</span>
                  <button
                    className="page-btn"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRides;
