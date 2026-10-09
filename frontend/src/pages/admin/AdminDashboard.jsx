// src/pages/admin/AdminDashboard.jsx
// Phase 6 — Admin Dashboard: live stats, revenue, quick actions, collapsible sidebar, CSV exports

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/common/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import {
  getDashboardStats,
  getAllRides,
  exportRidesCSV,
  exportUsersCSV,
} from '../../services/api';
import { formatTime } from '../../services/rideService';
import toast from 'react-hot-toast';
import './Admin.css';

// ── Stat Card ──────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, delay = 0 }) => (
  <div className="admin-stat-card" style={{ animationDelay: `${delay}ms`, borderColor: `${color}25` }}>
    <div className="admin-stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
    <div className="admin-stat-body">
      <div className="admin-stat-value" style={{ color }}>{value}</div>
      <div className="admin-stat-label">{label}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </div>
  </div>
);

// ── Mini Bar Chart (pure CSS/SVG) ──────────────────────────────
const MiniBarChart = ({ data, color }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="mini-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="mini-bar-wrap" title={`${d.label}: ${d.value}`}>
          <div
            className="mini-bar"
            style={{
              height: `${Math.max(4, (d.value / max) * 100)}%`,
              background: color,
              animationDelay: `${i * 60}ms`,
            }}
          />
          <div className="mini-bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// ── Donut Ring ─────────────────────────────────────────────────
const DonutChart = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let cumulative = 0;
  const R = 44, CX = 50, CY = 50;
  const circumference = 2 * Math.PI * R;

  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const offset = circumference * (1 - cumulative - pct);
    cumulative += pct;
    return { ...seg, dashArray: `${circumference * pct} ${circumference * (1 - pct)}`, dashOffset: offset + circumference * (1 - cumulative + pct) };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 100 100" className="donut-svg">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth="12"
            strokeDasharray={arc.dashArray}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.8s ease' }}
          />
        ))}
        <text x={CX} y={CY - 4} textAnchor="middle" fill="#f0f0ff" fontSize="14" fontWeight="800">
          {total}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="#6666a0" fontSize="7">
          total
        </text>
      </svg>
      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-dot" style={{ background: seg.color }} />
            <span className="donut-legend-label">{seg.label}</span>
            <span className="donut-legend-value" style={{ color: seg.color }}>
              {seg.value} ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Recent Ride Row ────────────────────────────────────────────
const STATUS_COLOR = {
  pending:   '#f59e0b',
  accepted:  '#06b6d4',
  ongoing:   '#a78bfa',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

const RideRow = ({ ride, index }) => (
  <div className={`admin-ride-row ${index % 2 === 0 ? 'even' : ''}`}>
    <div className="ride-row-info">
      <div className="ride-row-route">{ride.pickupAddress || 'Unknown'} → {ride.dropAddress || 'Unknown'}</div>
      <div className="ride-row-meta">
        🎓 {ride.studentName || 'Student'} · {formatTime(ride.createdAt)}
      </div>
    </div>
    <div className="ride-row-right">
      <span className="ride-status-pill" style={{ background: `${STATUS_COLOR[ride.status]}18`, color: STATUS_COLOR[ride.status], borderColor: `${STATUS_COLOR[ride.status]}35` }}>
        {ride.status}
      </span>
      <div className="ride-row-fare">₹{ride.fare ?? 0}</div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────
const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats]         = useState(null);
  const [recentRides, setRecent]  = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [exportingRides, setExportingRides] = useState(false);
  const [exportingUsers, setExportingUsers] = useState(false);
  const intervalRef               = useRef(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefresh(true);
    try {
      const [statsRes, ridesRes] = await Promise.all([
        getDashboardStats(),
        getAllRides(),
      ]);
      setStats(statsRes.stats);
      setRecent((ridesRes.rides || []).slice(0, 10));
    } catch (e) {
      console.error('Admin stats error', e);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(() => loadData(true), 30000); // auto-refresh every 30s
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleExportRides = async () => {
    setExportingRides(true);
    const loadId = toast.loading('Exporting rides CSV...');
    try {
      const blob = await exportRidesCSV();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rides_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Rides CSV exported successfully!', { id: loadId });
    } catch (e) {
      toast.error('Failed to export rides data', { id: loadId });
    } finally {
      setExportingRides(false);
    }
  };

  const handleExportUsers = async () => {
    setExportingUsers(true);
    const loadId = toast.loading('Exporting users CSV...');
    try {
      const blob = await exportUsersCSV();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Users CSV exported successfully!', { id: loadId });
    } catch (e) {
      toast.error('Failed to export users data', { id: loadId });
    } finally {
      setExportingUsers(false);
    }
  };

  // Build bar chart data (rides per day — simulated from recent rides createdAt)
  const buildDayChart = (rides) => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const counts = Array(7).fill(0);
    rides.forEach(r => {
      if (r.createdAt) {
        const day = new Date(r.createdAt).getDay(); // 0=Sun
        const idx = day === 0 ? 6 : day - 1;
        counts[idx]++;
      }
    });
    return days.map((label, i) => ({ label, value: counts[i] }));
  };

  const dayChartData = buildDayChart(recentRides);

  const rideSegments = stats ? [
    { label: 'Pending',   value: stats.pendingRides,   color: '#f59e0b' },
    { label: 'Completed', value: stats.completedRides, color: '#22c55e' },
    { label: 'Cancelled', value: stats.cancelledRides, color: '#ef4444' },
  ] : [];

  const userSegments = stats ? [
    { label: 'Students', value: stats.students, color: '#a78bfa' },
    { label: 'Drivers',  value: stats.drivers,  color: '#06b6d4'  },
  ] : [];

  if (loading) {
    return (
      <div style={{ display: 'flex' }}>
        <AdminSidebar />
        <div className="admin-loading admin-with-sidebar" style={{ flex: 1 }}>
          <div className="admin-spinner" />
          <p>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-page admin-with-sidebar" style={{ flex: 1, paddingTop: '0' }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
          @keyframes barGrow { from{height:0} to{height:var(--h)} }
          @keyframes spinPulse { 0%,100%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        `}</style>

        <div className="admin-container">
          {/* ── Header ── */}
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Admin Dashboard <span>⚙️</span></h1>
              <p className="admin-subtitle">
                Welcome back, {profile?.name?.split(' ')[0] || 'Admin'} — here's your platform overview.
              </p>
            </div>
            <div className="admin-header-actions">
              {refreshing && <span className="refreshing-badge">🔄 Refreshing…</span>}
              <button className="admin-refresh-btn" onClick={() => loadData(true)}>
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="admin-stats-grid">
            <StatCard icon="💰" label="Total Revenue"    value={`₹${stats?.totalRevenue ?? 0}`}    color="#22c55e" delay={0}   sub={`${stats?.completedRides ?? 0} completed rides`} />
            <StatCard icon="🚗" label="Total Rides"      value={stats?.totalRides ?? 0}             color="#06b6d4" delay={80}  sub={`${stats?.pendingRides ?? 0} pending`} />
            <StatCard icon="👥" label="Registered Users" value={stats?.totalUsers ?? 0}             color="#a78bfa" delay={160} sub={`${stats?.students ?? 0} students · ${stats?.drivers ?? 0} drivers`} />
            <StatCard icon="✅" label="Completed Rides"  value={stats?.completedRides ?? 0}         color="#f59e0b" delay={240} sub={`${stats?.cancelledRides ?? 0} cancelled`} />
          </div>

          {/* ── Charts Row ── */}
          <div className="admin-charts-row">
            {/* Rides by Day */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>📅 Rides by Day of Week</h3>
                <span className="admin-card-badge">Real-time</span>
              </div>
              <MiniBarChart data={dayChartData} color="#06b6d4" />
            </div>

            {/* Ride Status Donut */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>🍩 Ride Status Split</h3>
              </div>
              <DonutChart segments={rideSegments} />
            </div>

            {/* Users Donut */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>👤 User Distribution</h3>
              </div>
              <DonutChart segments={userSegments} />
            </div>
          </div>

          {/* ── CSV Export Center ── */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>📤 Database CSV Export Center</h3>
              <span className="admin-card-badge">Data Download</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666699', marginBottom: '1rem' }}>
              Download complete raw tabular lists from the Firestore database as standard CSV spreadsheets.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                id="export-rides-csv-btn"
                onClick={handleExportRides}
                disabled={exportingRides}
                style={{
                  background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '10px', color: '#06b6d4', padding: '0.65rem 1.25rem', fontSize: '0.86rem',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                📊 Export All Trips CSV
              </button>
              <button
                id="export-users-csv-btn"
                onClick={handleExportUsers}
                disabled={exportingUsers}
                style={{
                  background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.25)',
                  borderRadius: '10px', color: '#a78bfa', padding: '0.65rem 1.25rem', fontSize: '0.86rem',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                👥 Export All Users CSV
              </button>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="admin-actions-row">
            {[
              { to: '/admin/monitor', icon: '📡', label: 'Live Monitor dispatches', sub: 'Real-time live active dispatches', color: '#a78bfa' },
              { to: '/admin/analytics', icon: '📊', label: 'Advanced Analytics', sub: 'Historical trends & reports charts', color: '#06b6d4' },
              { to: '/admin/revenue', icon: '💰', label: 'Revenue Finance', sub: 'Payments methods earnings reports', color: '#22c55e' },
              { to: '/admin/drivers', icon: '🚗', label: 'Driver Verification', sub: 'Inspect registration documents', color: '#f59e0b' },
              { to: '/admin/notifications', icon: '🔔', label: 'Alerts Broadcast', sub: 'Broadcast system-wide notices alerts', color: '#ec4899' },
              { to: '/admin/settings', icon: '⚙️', label: 'System Configuration', sub: 'Manage platforms states rates', color: '#6366f1' },
            ].map(a => (
              <Link key={a.to} to={a.to} className="admin-action-card" style={{ borderColor: `${a.color}25` }}>
                <div className="admin-action-icon" style={{ background: `${a.color}18`, color: a.color }}>{a.icon}</div>
                <div>
                  <div className="admin-action-label" style={{ color: a.color }}>{a.label}</div>
                  <div className="admin-action-sub">{a.sub}</div>
                </div>
                <span className="admin-action-arrow" style={{ color: a.color }}>→</span>
              </Link>
            ))}
          </div>

          {/* ── Recent Rides ── */}
          <div className="admin-card" style={{ marginTop: '0' }}>
            <div className="admin-card-header">
              <h3>🕑 Recent Rides</h3>
              <Link to="/admin/rides" className="admin-view-all">View All →</Link>
            </div>
            {recentRides.length === 0 ? (
              <div className="admin-empty">No rides yet.</div>
            ) : (
              <div className="admin-rides-list">
                {recentRides.map((ride, i) => (
                  <RideRow key={ride.id} ride={ride} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* ── Phase banner ── */}
          <div className="admin-phase-banner">
            <span style={{ fontSize: '1.4rem' }}>🚀</span>
            <div>
              <p className="banner-title">Phase 6 Active — Advanced Dashboard & Platform Intelligence</p>
              <p className="banner-sub">Expanded analytics, real-time live monitor, notifications broadcasts, configurations and export controls are live!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
