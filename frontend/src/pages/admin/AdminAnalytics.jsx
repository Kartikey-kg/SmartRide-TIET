// src/pages/admin/AdminAnalytics.jsx
// Phase 6 — Advanced Analytics: SVG line/area charts, KPI cards, period toggle
// Phase 7 — ML Predictions: Python FastAPI integration

import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/common/AdminSidebar';
import { getAdvancedAnalytics, getMLPredictions } from '../../services/api';
import toast from 'react-hot-toast';
import './AdminAnalytics.css';

// ── SVG Line / Area Chart ──────────────────────────────────────
const LineChart = ({ data, valueKey, color, label, prefix = '', suffix = '', height = 200 }) => {
  if (!data || data.length === 0) return <div className="chart-empty">No data</div>;

  const values  = data.map(d => d[valueKey] ?? 0);
  const maxVal  = Math.max(...values, 1);
  const w       = 600;
  const h       = height;
  const padX    = 40;
  const padY    = 20;
  const innerW  = w - padX * 2;
  const innerH  = h - padY * 2;

  const pts = values.map((v, i) => ({
    x: padX + (i / (values.length - 1 || 1)) * innerW,
    y: padY + (1 - v / maxVal) * innerH,
    v,
    label: data[i].label || data[i].date,
  }));

  const linePath  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath  = `${linePath} L${pts[pts.length - 1].x},${padY + innerH} L${pts[0].x},${padY + innerH} Z`;

  // Y-axis labels
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y:   padY + (1 - t) * innerH,
    val: Math.round(maxVal * t),
  }));

  return (
    <div className="line-chart-wrap">
      <div className="chart-header">
        <span className="chart-label" style={{ color }}>{label}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${w} ${h}`} className="line-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={padX} x2={w - padX} y1={t.y} y2={t.y}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={padX - 5} y={t.y + 4} fill="#44447a" fontSize="9" textAnchor="end">
                {prefix}{t.val}{suffix}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#grad-${label})`} />

          {/* Line */}
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots + tooltips */}
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="#08082a" strokeWidth="2" />
              <title>{p.label}: {prefix}{p.v}{suffix}</title>
            </g>
          ))}

          {/* X-axis labels */}
          {pts.map((p, i) => {
            const show = pts.length <= 10 || i % Math.ceil(pts.length / 10) === 0 || i === pts.length - 1;
            return show ? (
              <text key={i} x={p.x} y={h - 3} fill="#44447a" fontSize="8" textAnchor="middle">
                {p.label}
              </text>
            ) : null;
          })}
        </svg>
      </div>
    </div>
  );
};

// ── KPI Card ───────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, color, delay = 0 }) => (
  <div className="kpi-card" style={{ animationDelay: `${delay}ms`, borderColor: `${color}25` }}>
    <div className="kpi-icon" style={{ background: `${color}18`, color }}>{icon}</div>
    <div className="kpi-body">
      <div className="kpi-value" style={{ color }}>{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  </div>
);

// ── Main ───────────────────────────────────────────────────────
const AdminAnalytics = () => {
  const [period,  setPeriod]  = useState(7);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── ML predictions state ─────────────────────────────────────
  const [mlData,    setMlData]    = useState(null);
  const [mlLoading, setMlLoading] = useState(true);
  const [mlOffline, setMlOffline] = useState(false);

  const fetchData = async (p) => {
    setLoading(true);
    try {
      const res = await getAdvancedAnalytics(p);
      setData(res);
    } catch (e) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch ML predictions using the shared axios api instance ──
  const fetchML = async () => {
    setMlLoading(true);
    setMlOffline(false);
    try {
      const result = await getMLPredictions();
      setMlData(result);
    } catch (e) {
      setMlOffline(true);
    } finally {
      setMlLoading(false);
    }
  };

  useEffect(() => { fetchData(period); }, [period]);
  useEffect(() => { fetchML(); }, []);

  const kpis = data?.kpis;
  const buckets = data?.buckets || [];

  return (
    <div className="analytics-layout">
      <AdminSidebar />
      <div className="analytics-main admin-with-sidebar">
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        {/* Header */}
        <div className="analytics-header">
          <div>
            <h1 className="analytics-title">📊 Advanced Analytics</h1>
            <p className="analytics-sub">Ride trends and performance metrics over time</p>
          </div>
          <div className="period-toggle">
            {[7, 14, 30].map(p => (
              <button
                key={p}
                id={`period-btn-${p}`}
                className={`period-btn${period === p ? ' active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="asb-spinner" />
            <p>Loading analytics…</p>
          </div>
        ) : (
          <>
            {/* ── ML Predictions Section ─────────────────────────────── */}
            <div className="ml-section">
              <div className="ml-section-header">
                <div className="ml-title-row">
                  <span className="ml-icon">🤖</span>
                  <h2 className="ml-heading">ML Predictions</h2>
                  <span className="ml-badge">AI Powered</span>
                </div>
                <p className="ml-sub">Live predictions from your Python ML model trained on Firebase data</p>
              </div>

              {mlLoading ? (
                <div className="ml-loading">
                  <div className="asb-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                  <span>Connecting to ML server…</span>
                </div>
              ) : mlOffline ? (
                <div className="ml-offline">
                  <span className="ml-offline-icon">⚠️</span>
                  <div>
                    <p className="ml-offline-title">ML Server Offline</p>
                    <p className="ml-offline-sub">
                      Start it with: <code>python app.py</code> inside <code>/ml-server</code>
                    </p>
                  </div>
                  <button className="ml-retry-btn" onClick={fetchML}>Retry</button>
                </div>
              ) : (
                <div className="ml-cards-grid">
                  {/* Demand */}
                  <div className="ml-card" style={{ '--ml-color': '#06b6d4' }}>
                    <div className="ml-card-icon">🔮</div>
                    <div className="ml-card-body">
                      <div className="ml-card-value">
                        {mlData?.demand?.predicted_rides ?? '—'}
                        <span className="ml-card-unit"> rides</span>
                      </div>
                      <div className="ml-card-label">Predicted Rides Tomorrow</div>
                      <div className="ml-card-sub">Based on historical patterns</div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="ml-card" style={{ '--ml-color': '#22c55e' }}>
                    <div className="ml-card-icon">💰</div>
                    <div className="ml-card-body">
                      <div className="ml-card-value">
                        ₹{mlData?.revenue?.predicted_revenue
                          ? Number(mlData.revenue.predicted_revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })
                          : '—'}
                      </div>
                      <div className="ml-card-label">Predicted Revenue (7 days)</div>
                      <div className="ml-card-sub">Next week forecast</div>
                    </div>
                  </div>

                  {/* Cancellation Risk */}
                  <div className="ml-card" style={{
                    '--ml-color': mlData?.cancellation_risk?.pct >= 60
                      ? '#ef4444'
                      : mlData?.cancellation_risk?.pct >= 30
                        ? '#f59e0b'
                        : '#22c55e'
                  }}>
                    <div className="ml-card-icon">⚠️</div>
                    <div className="ml-card-body">
                      <div className="ml-card-value">
                        {mlData?.cancellation_risk?.label ?? '—'}
                      </div>
                      <div className="ml-card-label">Cancellation Risk Now</div>
                      <div className="ml-card-sub">Current hour probability</div>
                    </div>
                  </div>

                  {/* Surge */}
                  <div className="ml-card" style={{
                    '--ml-color': mlData?.surge?.is_surge ? '#f59e0b' : '#a78bfa'
                  }}>
                    <div className="ml-card-icon">⚡</div>
                    <div className="ml-card-body">
                      <div className="ml-card-value">
                        {mlData?.surge?.label ?? '1.0×'}
                      </div>
                      <div className="ml-card-label">Surge Multiplier</div>
                      <div className="ml-card-sub">{mlData?.surge?.reason ?? 'Normal'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* KPI Cards */}
            <div className="kpi-grid">
              <KpiCard icon="🚗" label="Total Rides"       value={kpis?.totalRides}        color="#06b6d4" delay={0}   sub={`Last ${period} days`} />
              <KpiCard icon="💰" label="Total Revenue"     value={`₹${kpis?.totalRevenue ?? 0}`} color="#22c55e" delay={80}  sub="Completed rides only" />
              <KpiCard icon="📈" label="Avg Daily Rides"   value={kpis?.avgDailyRides}     color="#a78bfa" delay={160} />
              <KpiCard icon="🏆" label="Peak Day"          value={kpis?.peakDayLabel || '—'} color="#f59e0b" delay={240} sub={kpis?.peakRides ? `${kpis.peakRides} rides` : ''} />
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <LineChart
                  data={buckets}
                  valueKey="rides"
                  color="#06b6d4"
                  label="Rides per Day"
                />
              </div>
              <div className="chart-card">
                <LineChart
                  data={buckets}
                  valueKey="revenue"
                  color="#22c55e"
                  label="Revenue per Day"
                  prefix="₹"
                />
              </div>
              <div className="chart-card">
                <LineChart
                  data={buckets}
                  valueKey="completed"
                  color="#a78bfa"
                  label="Completed Rides"
                />
              </div>
              <div className="chart-card">
                <LineChart
                  data={buckets}
                  valueKey="cancelled"
                  color="#ef4444"
                  label="Cancelled Rides"
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="analytics-table-card">
              <div className="table-card-header">
                <h3>📋 Daily Breakdown</h3>
                <span className="table-badge">{buckets.length} days</span>
              </div>
              <div className="table-scroll">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Rides</th>
                      <th>Completed</th>
                      <th>Cancelled</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...buckets].reverse().map((b, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'even' : ''}>
                        <td>{b.label}</td>
                        <td style={{ color: '#06b6d4', fontWeight: 700 }}>{b.rides}</td>
                        <td style={{ color: '#22c55e' }}>{b.completed}</td>
                        <td style={{ color: '#ef4444' }}>{b.cancelled}</td>
                        <td style={{ color: '#f59e0b', fontWeight: 700 }}>₹{b.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
