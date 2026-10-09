// src/pages/admin/AdminRevenueReport.jsx
// Phase 6 — Revenue & Finance Report: razorpay vs wallet breakdown, top drivers, 30-day revenue chart

import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/common/AdminSidebar';
import { getRevenueReport } from '../../services/api';
import toast from 'react-hot-toast';
import './AdminAnalytics.css'; // Reuse analytics styles for layout/tables

const MiniBarChart30 = ({ data }) => {
  if (!data || data.length === 0) return <div className="chart-empty">No data</div>;
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="mini-bar-chart" style={{ display: 'flex', alignItems: 'flex-end', height: '220px', gap: '4px', padding: '1rem 0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
          <div
            style={{
              width: '100%',
              height: `${(d.amount / max) * 100}%`,
              minHeight: d.amount > 0 ? '4px' : '0',
              background: 'linear-gradient(180deg, #22c55e, #15803d)',
              borderRadius: '4px 4px 0 0',
              position: 'relative',
              transition: 'height 0.5s ease',
            }}
            title={`${d.label}: ₹${d.amount}`}
          />
          {i % 5 === 0 && (
            <div style={{ fontSize: '8px', color: '#4a4a80', marginTop: '6px', whiteSpace: 'nowrap' }}>
              {d.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const PaymentSplitProgress = ({ razorpay, wallet, total }) => {
  const rpPct = total > 0 ? Math.round((razorpay / total) * 100) : 0;
  const wlPct = total > 0 ? Math.round((wallet / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          <span style={{ color: '#06b6d4', fontWeight: 600 }}>💳 Razorpay Payments</span>
          <span style={{ color: '#f0f0ff' }}>₹{razorpay} ({rpPct}%)</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${rpPct}%`, height: '100%', background: '#06b6d4', borderRadius: '4px', transition: 'width 0.8s ease' }} />
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          <span style={{ color: '#a78bfa', fontWeight: 600 }}>👛 Wallet Payments</span>
          <span style={{ color: '#f0f0ff' }}>₹{wallet} ({wlPct}%)</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${wlPct}%`, height: '100%', background: '#a78bfa', borderRadius: '4px', transition: 'width 0.8s ease' }} />
        </div>
      </div>
    </div>
  );
};

const AdminRevenueReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getRevenueReport();
      setData(res);
    } catch (e) {
      toast.error('Failed to load revenue report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = data?.summary;
  const topDrivers = data?.topDrivers || [];
  const dailyRevenue = data?.dailyRevenue || [];

  return (
    <div className="analytics-layout">
      <AdminSidebar />
      <div className="analytics-main admin-with-sidebar">
        <div className="analytics-header">
          <div>
            <h1 className="analytics-title">💰 Revenue & Finance Report</h1>
            <p className="analytics-sub">Platform earnings, payment distributions, and driver payout data</p>
          </div>
          <button className="admin-refresh-btn" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#a0a0cc', cursor: 'pointer' }} onClick={loadData}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="asb-spinner" />
            <p>Loading financial insights…</p>
          </div>
        ) : (
          <>
            {/* Summary Grid */}
            <div className="kpi-grid">
              <div className="kpi-card" style={{ borderColor: 'rgba(34,197,94,0.15)' }}>
                <div className="kpi-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>🪙</div>
                <div className="kpi-body">
                  <div className="kpi-value" style={{ color: '#22c55e' }}>₹{summary?.totalRevenue ?? 0}</div>
                  <div className="kpi-label">Total Revenue Generated</div>
                  <div className="kpi-sub">All-time completed rides</div>
                </div>
              </div>
              <div className="kpi-card" style={{ borderColor: 'rgba(6,182,212,0.15)' }}>
                <div className="kpi-icon" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>💳</div>
                <div className="kpi-body">
                  <div className="kpi-value" style={{ color: '#06b6d4' }}>₹{summary?.razorpayTotal ?? 0}</div>
                  <div className="kpi-label">Razorpay Total</div>
                  <div className="kpi-sub">Direct card/UPI gateways</div>
                </div>
              </div>
              <div className="kpi-card" style={{ borderColor: 'rgba(167,139,250,0.15)' }}>
                <div className="kpi-icon" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>👛</div>
                <div className="kpi-body">
                  <div className="kpi-value" style={{ color: '#a78bfa' }}>₹{summary?.walletTotal ?? 0}</div>
                  <div className="kpi-label">Wallet Total</div>
                  <div className="kpi-sub">Campus SmartRide Wallet</div>
                </div>
              </div>
              <div className="kpi-card" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
                <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>🚗</div>
                <div className="kpi-body">
                  <div className="kpi-value" style={{ color: '#f59e0b' }}>{summary?.totalCompletedRides ?? 0}</div>
                  <div className="kpi-label">Completed Rides</div>
                  <div className="kpi-sub">Successful checkouts</div>
                </div>
              </div>
            </div>

            {/* Split & Daily Trend */}
            <div className="charts-grid">
              {/* Payment Split */}
              <div className="chart-card">
                <div className="chart-header" style={{ marginBottom: '1.5rem' }}>
                  <span className="chart-label" style={{ color: '#f0f0ff' }}>👛 Payment Method Distribution</span>
                </div>
                <PaymentSplitProgress
                  razorpay={summary?.razorpayTotal ?? 0}
                  wallet={summary?.walletTotal ?? 0}
                  total={summary?.totalRevenue ?? 1}
                />
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', fontSize: '0.8rem', color: '#555580', border: '1px dashed rgba(255,255,255,0.03)' }}>
                  💡 <strong>Tip:</strong> Wallet transactions reduce gateway fees and offer students faster cashback/refund execution. Consider launching wallet top-up promotions!
                </div>
              </div>

              {/* 30-day Trend */}
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-label" style={{ color: '#22c55e' }}>📅 30-Day Daily Revenue Trend</span>
                </div>
                <MiniBarChart30 data={dailyRevenue} />
              </div>
            </div>

            {/* Top Drivers Table */}
            <div className="analytics-table-card">
              <div className="table-card-header">
                <h3>🏆 Top 5 Earning Drivers</h3>
                <span className="table-badge">Platform Leaders</span>
              </div>
              <div className="table-scroll">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Driver Name</th>
                      <th>Driver ID</th>
                      <th>Completed Rides</th>
                      <th>Total Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDrivers.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#4a4a80', padding: '2rem' }}>
                          No driver earnings logged yet.
                        </td>
                      </tr>
                    ) : (
                      topDrivers.map((d, idx) => (
                        <tr key={d.id} className={idx % 2 === 0 ? 'even' : ''}>
                          <td style={{ fontWeight: 800 }}>
                            {idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `${idx + 1}th`}
                          </td>
                          <td style={{ fontWeight: 600 }}>{d.name}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6666a0' }}>{d.id}</td>
                          <td>{d.rides}</td>
                          <td style={{ color: '#22c55e', fontWeight: 800 }}>₹{d.earnings}</td>
                        </tr>
                      ))
                    )}
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

export default AdminRevenueReport;
