// src/pages/admin/AdminLiveMonitor.jsx
// Phase 6 — Real-time Active Ride Monitor: real-time updates of active, ongoing, accepted and pending rides with cancel action

import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../../components/common/AdminSidebar';
import { getLiveRides, cancelRideAdmin } from '../../services/api';
import { getRideStatusMeta, formatTime } from '../../services/rideService';
import toast from 'react-hot-toast';
import './AdminAnalytics.css';

const STATUS_COLOR = {
  pending:   '#f59e0b',
  accepted:  '#06b6d4',
  ongoing:   '#a78bfa',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

const ActiveRideRow = ({ ride, onCancel, index }) => {
  const meta = getRideStatusMeta(ride.status);
  return (
    <tr className={index % 2 === 0 ? 'even' : ''}>
      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6666a0' }}>{ride.id.slice(0, 8)}...</td>
      <td style={{ fontWeight: 600 }}>{ride.studentName || 'Student'}</td>
      <td style={{ color: ride.driverName ? '#d0d0f0' : '#555580', fontStyle: ride.driverName ? 'normal' : 'italic' }}>
        {ride.driverName ? `🚗 ${ride.driverName}` : 'Unassigned'}
      </td>
      <td>
        <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
          {ride.pickupAddress || 'Unknown'} ➔ {ride.dropAddress || 'Unknown'}
        </span>
      </td>
      <td style={{ color: '#f59e0b', fontWeight: 800 }}>₹{ride.fare ?? 0}</td>
      <td>
        <span style={{
          background: `${STATUS_COLOR[ride.status]}12`, color: STATUS_COLOR[ride.status],
          border: `1px solid ${STATUS_COLOR[ride.status]}25`, borderRadius: '20px',
          padding: '0.22rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize'
        }}>
          {ride.status}
        </span>
      </td>
      <td>{formatTime(ride.createdAt)}</td>
      <td>
        {['pending', 'accepted', 'ongoing'].includes(ride.status) && (
          <button
            onClick={() => onCancel(ride.id)}
            style={{
              padding: '0.35rem 0.65rem', border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderRadius: '6px',
              fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(239, 68, 68, 0.12)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(239, 68, 68, 0.05)'; }}
          >
            Cancel Trip
          </button>
        )}
      </td>
    </tr>
  );
};

const AdminLiveMonitor = () => {
  const [rides, setRides] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, ongoing: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [secondsToRefresh, setSecondsToRefresh] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchLiveFeed = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getLiveRides();
      setRides(res.rides || []);
      setCounts(res.counts || { pending: 0, accepted: 0, ongoing: 0, total: 0 });
    } catch (e) {
      toast.error('Failed to update live monitor feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSecondsToRefresh(10);
    }
  };

  useEffect(() => {
    fetchLiveFeed();

    // Reset countdown clock every 1 second
    countdownRef.current = setInterval(() => {
      setSecondsToRefresh(prev => {
        if (prev <= 1) {
          fetchLiveFeed(true);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownRef.current);
    };
  }, []);

  const handleCancelRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to cancel this trip? The student and driver will be notified.')) return;
    const loadId = toast.loading('Cancelling active ride...');
    try {
      await cancelRideAdmin(rideId);
      toast.success('Active ride cancelled by administrator.', { id: loadId });
      fetchLiveFeed(true);
    } catch (e) {
      toast.error(e?.error || 'Failed to cancel active ride', { id: loadId });
    }
  };

  return (
    <div className="analytics-layout">
      <AdminSidebar />
      <div className="analytics-main admin-with-sidebar">
        <div className="analytics-header">
          <div>
            <h1 className="analytics-title">📡 Live Platform Dispatch</h1>
            <p className="analytics-sub">Real-time status tracking and dispatcher controls for all pending and active campus trips</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#6666a0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="dot-pulse" style={{
                width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%',
                display: 'inline-block', animation: 'pulse 1.5s infinite ease-in-out'
              }} />
              Auto-refreshing in <strong style={{ color: '#06b6d4' }}>{secondsToRefresh}s</strong>
            </span>
            <button
              className="admin-refresh-btn"
              style={{
                padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                color: '#a0a0cc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}
              onClick={() => fetchLiveFeed(true)}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : '↻ Force Refresh'}
            </button>
          </div>
        </div>

        {/* Live Counters Grid */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="kpi-card" style={{ borderColor: 'rgba(167,139,250,0.15)' }}>
            <div className="kpi-icon" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>📡</div>
            <div className="kpi-body">
              <div className="kpi-value" style={{ color: '#a78bfa' }}>{counts.total}</div>
              <div className="kpi-label">Active Dispatches</div>
              <div className="kpi-sub">Total under monitor</div>
            </div>
          </div>
          <div className="kpi-card" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
            <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>⏳</div>
            <div className="kpi-body">
              <div className="kpi-value" style={{ color: '#f59e0b' }}>{counts.pending}</div>
              <div className="kpi-label">Pending Requests</div>
              <div className="kpi-sub">Awaiting driver accept</div>
            </div>
          </div>
          <div className="kpi-card" style={{ borderColor: 'rgba(6,182,212,0.15)' }}>
            <div className="kpi-icon" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>🤝</div>
            <div className="kpi-body">
              <div className="kpi-value" style={{ color: '#06b6d4' }}>{counts.accepted}</div>
              <div className="kpi-label">Accepted Trips</div>
              <div className="kpi-sub">Driver is en-route</div>
            </div>
          </div>
          <div className="kpi-card" style={{ borderColor: 'rgba(167,139,250,0.15)' }}>
            <div className="kpi-icon" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>🚕</div>
            <div className="kpi-body">
              <div className="kpi-value" style={{ color: '#a78bfa' }}>{counts.ongoing}</div>
              <div className="kpi-label">Ongoing Trips</div>
              <div className="kpi-sub">Passenger on board</div>
            </div>
          </div>
        </div>

        {/* Live Rides Feed Table */}
        <div className="analytics-table-card">
          <div className="table-card-header">
            <h3>📡 Real-time Active Rides List</h3>
            <span className="table-badge" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>Live Feed</span>
          </div>
          <div className="table-scroll">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Student Details</th>
                  <th>Assigned Driver</th>
                  <th>Route (Pickup ➔ Destination)</th>
                  <th>Fare</th>
                  <th>Status</th>
                  <th>Dispatched At</th>
                  <th>Action Control</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="asb-spinner" style={{ margin: '0 auto 1rem' }} />
                      <span style={{ color: '#6666a0' }}>Loading active dispatches...</span>
                    </td>
                  </tr>
                ) : rides.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: '#555580', padding: '4rem 1rem' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
                      <h3>No Active Dispatches</h3>
                      <p style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>There are currently no active ride bookings being serviced on campus.</p>
                    </td>
                  </tr>
                ) : (
                  rides.map((ride, idx) => (
                    <ActiveRideRow
                      key={ride.id}
                      ride={ride}
                      onCancel={handleCancelRide}
                      index={idx}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AdminLiveMonitor;
