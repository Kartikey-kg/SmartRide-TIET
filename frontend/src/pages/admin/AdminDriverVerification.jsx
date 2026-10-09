// src/pages/admin/AdminDriverVerification.jsx
// Phase 6 — Driver Verification Panel: approve/reject driver profile and vehicle documentation

import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/common/AdminSidebar';
import { getPendingDrivers, verifyDriver } from '../../services/api';
import toast from 'react-hot-toast';
import './AdminAnalytics.css'; // For basic structures, or custom styles inside

const RejectModal = ({ driver, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignExact: 'center', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{
        background: '#0e0e28', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px',
        padding: '2rem', maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem', textAlign: 'center' }}>⚠️</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', color: '#ef4444' }}>Reject Driver Application</h3>
        <p style={{ fontSize: '0.88rem', color: '#a0a0cc', textAlign: 'center' }}>
          Please specify a reason for rejecting <strong>{driver.name || driver.email}</strong>:
        </p>
        <textarea
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', color: '#f0f0ff', padding: '0.75rem', fontSize: '0.88rem',
            resize: 'none', height: '100px', fontFamily: 'inherit'
          }}
          placeholder="e.g. Invalid vehicle registration number or license image is blurry..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="modal-cancel-btn" style={{
            flex: 1, padding: '0.6rem', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
            borderRadius: '8px', color: '#a0a0cc', cursor: 'pointer', fontWeight: 600
          }} onClick={onCancel}>Cancel</button>
          <button className="modal-confirm-btn" style={{
            flex: 1, padding: '0.6rem', border: 'none', background: '#ef4444',
            borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600
          }} onClick={() => onConfirm(reason)} disabled={!reason.trim()}>Reject Application</button>
        </div>
      </div>
    </div>
  );
};

const DriverCard = ({ driver, onApprove, onReject, tab }) => {
  const initials = (driver.name || driver.email || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.015)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      transition: 'all 0.25s ease',
      position: 'relative',
    }}>
      {/* Header Info */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{
          width: '46px', height: '46px', borderRadius: '50%',
          background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4',
          fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {initials}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0ff' }}>{driver.name || 'Anonymous Driver'}</span>
          <span style={{ fontSize: '0.8rem', color: '#6666a0' }}>{driver.email}</span>
        </div>
      </div>

      {/* Vehicle / License Info */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
        padding: '0.85rem', background: 'rgba(255,255,255,0.01)', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.82rem'
      }}>
        <div>
          <span style={{ color: '#555580', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle Number</span>
          <span style={{ fontWeight: 600, color: '#d0d0f0', fontFamily: 'monospace' }}>{driver.vehicleNumber || 'Not provided'}</span>
        </div>
        <div>
          <span style={{ color: '#555580', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle Type</span>
          <span style={{ fontWeight: 600, color: '#d0d0f0' }}>{driver.vehicleType || 'Not provided'}</span>
        </div>
        {driver.phone && (
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#555580', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</span>
            <span style={{ fontWeight: 600, color: '#d0d0f0' }}>📞 {driver.phone}</span>
          </div>
        )}
      </div>

      {/* Status or Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
        {tab === 'pending' && (
          <>
            <button
              onClick={() => onReject(driver)}
              style={{
                flex: 1, padding: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderRadius: '8px',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              ❌ Reject
            </button>
            <button
              onClick={() => onApprove(driver.id)}
              style={{
                flex: 1, padding: '0.5rem', border: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', borderRadius: '8px',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              ✅ Approve
            </button>
          </>
        )}
        {tab === 'approved' && (
          <div style={{
            width: '100%', padding: '0.45rem', textAlign: 'center',
            background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e',
            border: '1px solid rgba(34, 197, 94, 0.15)', borderRadius: '8px',
            fontSize: '0.78rem', fontWeight: 700
          }}>
            ✔️ Verified Application
          </div>
        )}
        {tab === 'rejected' && (
          <div style={{ width: '100%' }}>
            <div style={{
              width: '100%', padding: '0.45rem', textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px',
              fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem'
            }}>
              ✖️ Rejected Application
            </div>
            {driver.rejectionReason && (
              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontStyle: 'italic', background: 'rgba(239,68,68,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                Reason: {driver.rejectionReason}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDriverVerification = () => {
  const [data, setData] = useState({ pending: [], approved: [], rejected: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending | approved | rejected
  const [rejectingDriver, setRejectingDriver] = useState(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await getPendingDrivers();
      setData({
        pending: res.pending || [],
        approved: res.approved || [],
        rejected: res.rejected || []
      });
    } catch (e) {
      toast.error('Failed to retrieve driver listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleApprove = async (driverId) => {
    const loadId = toast.loading('Approving driver...');
    try {
      await verifyDriver(driverId, true);
      toast.success('Driver application approved!', { id: loadId });
      fetchDrivers();
    } catch (e) {
      toast.error(e?.error || 'Failed to approve driver', { id: loadId });
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectingDriver) return;
    const loadId = toast.loading('Rejecting driver application...');
    try {
      await verifyDriver(rejectingDriver.id, false, reason);
      toast.success('Driver application rejected.', { id: loadId });
      setRejectingDriver(null);
      fetchDrivers();
    } catch (e) {
      toast.error(e?.error || 'Failed to reject application', { id: loadId });
    }
  };

  const currentList = data[activeTab] || [];

  return (
    <div className="analytics-layout">
      <AdminSidebar />
      {rejectingDriver && (
        <RejectModal
          driver={rejectingDriver}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectingDriver(null)}
        />
      )}
      <div className="analytics-main admin-with-sidebar">
        <div className="analytics-header">
          <div>
            <h1 className="analytics-title">🚗 Driver Verification Panel</h1>
            <p className="analytics-sub">Inspect registration details, vehicle details and authorize driver profiles</p>
          </div>
          <button className="admin-refresh-btn" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#a0a0cc', cursor: 'pointer' }} onClick={fetchDrivers}>
            ↻ Refresh
          </button>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.35rem', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { id: 'pending', label: 'Pending', count: data.pending.length, icon: '⏳' },
            { id: 'approved', label: 'Verified', count: data.approved.length, icon: '✅' },
            { id: 'rejected', label: 'Rejected', count: data.rejected.length, icon: '❌' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#6666a0',
                padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.84rem', transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : '#4a4a80',
                fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '10px', fontWeight: 800
              }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="asb-spinner" />
            <p>Loading application lists…</p>
          </div>
        ) : (
          <>
            {currentList.length === 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)',
                borderRadius: '16px', padding: '6rem 2rem', textAlign: 'center', color: '#555580'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📂</div>
                <h3>No Applications Found</h3>
                <p style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>There are currently no driver accounts matching this verification status.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {currentList.map((driver, idx) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    onApprove={handleApprove}
                    onReject={setRejectingDriver}
                    tab={activeTab}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDriverVerification;
