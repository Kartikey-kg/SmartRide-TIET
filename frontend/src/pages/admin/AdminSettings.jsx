// src/pages/admin/AdminSettings.jsx
// Phase 6 — System Settings: manage platform states, fares, auto-accept and maintenance controls

import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/common/AdminSidebar';
import { getSystemSettings, updateSystemSettings } from '../../services/api';
import toast from 'react-hot-toast';
import './AdminAnalytics.css';

const AdminSettings = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rideBookingEnabled, setRideBookingEnabled] = useState(true);
  const [driverAutoAccept, setDriverAutoAccept] = useState(false);
  const [fareMultiplier, setFareMultiplier] = useState(1.0);
  const [maxRideDistance, setMaxRideDistance] = useState(20);
  const [platformMessage, setPlatformMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getSystemSettings();
      const s = res.settings || {};
      setMaintenanceMode(s.maintenanceMode ?? false);
      setRideBookingEnabled(s.rideBookingEnabled ?? true);
      setDriverAutoAccept(s.driverAutoAccept ?? false);
      setFareMultiplier(s.fareMultiplier ?? 1.0);
      setMaxRideDistance(s.maxRideDistance ?? 20);
      setPlatformMessage(s.platformMessage ?? '');
    } catch (e) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const loadId = toast.loading('Updating system settings...');
    try {
      await updateSystemSettings({
        maintenanceMode,
        rideBookingEnabled,
        driverAutoAccept,
        fareMultiplier: parseFloat(fareMultiplier),
        maxRideDistance: parseInt(maxRideDistance),
        platformMessage
      });
      toast.success('System settings updated successfully!', { id: loadId });
      fetchSettings();
    } catch (e) {
      toast.error(e?.error || 'Failed to update system settings', { id: loadId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="analytics-layout">
      <AdminSidebar />
      <div className="analytics-main admin-with-sidebar">
        <div className="analytics-header">
          <div>
            <h1 className="analytics-title">⚙️ System Configuration</h1>
            <p className="analytics-sub">Manage platform state parameters, surge multipliers, thresholds, and warning banners</p>
          </div>
          <button className="admin-refresh-btn" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#a0a0cc', cursor: 'pointer' }} onClick={fetchSettings}>
            ↻ Reload
          </button>
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="asb-spinner" />
            <p>Retrieving platform settings…</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Left Column: Toggles & Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0f0ff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
                  🚦 Platform Status Toggles
                </h3>

                {/* Maintenance Mode */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f0f0ff' }}>Maintenance Mode</span>
                    <span style={{ fontSize: '0.78rem', color: '#6666a0' }}>Puts the app in offline state. Shows a warning banner to everyone.</span>
                  </div>
                  <input
                    id="toggle-maintenance"
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={e => setMaintenanceMode(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#ef4444', cursor: 'pointer' }}
                  />
                </div>

                {/* Ride Booking Toggles */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f0f0ff' }}>Allow New Ride Bookings</span>
                    <span style={{ fontSize: '0.78rem', color: '#6666a0' }}>Temporary disable bookings if rides are congested or weather is bad.</span>
                  </div>
                  <input
                    id="toggle-ride-booking"
                    type="checkbox"
                    checked={rideBookingEnabled}
                    onChange={e => setRideBookingEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#22c55e', cursor: 'pointer' }}
                  />
                </div>

                {/* Driver Auto-Accept */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f0f0ff' }}>Driver Auto-Accept</span>
                    <span style={{ fontSize: '0.78rem', color: '#6666a0' }}>Force auto-assign closest driver without requiring manual match.</span>
                  </div>
                  <input
                    id="toggle-auto-accept"
                    type="checkbox"
                    checked={driverAutoAccept}
                    onChange={e => setDriverAutoAccept(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#06b6d4', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Fare & Surge Multiplier */}
              <div style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0f0ff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
                  📈 Fares & Limits Configuration
                </h3>

                {/* Fare Multiplier (Surge) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f0f0ff' }}>Surge Fare Multiplier</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                      {fareMultiplier.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    id="input-fare-multiplier"
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={fareMultiplier}
                    onChange={e => setFareMultiplier(e.target.value)}
                    style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#6666a0' }}>Increases baseline trip fare system-wide. Adjust during heavy demand or peak hours.</span>
                </div>

                {/* Max Ride Distance */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label htmlFor="input-max-distance" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f0f0ff' }}>Max Allowed Distance (km)</label>
                  <input
                    id="input-max-distance"
                    type="number"
                    min="1"
                    max="50"
                    value={maxRideDistance}
                    onChange={e => setMaxRideDistance(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px', color: '#f0f0ff', padding: '0.6rem', fontSize: '0.88rem',
                      width: '120px', fontFamily: 'inherit'
                    }}
                    required
                  />
                  <span style={{ fontSize: '0.74rem', color: '#6666a0' }}>Prevents booking of rides that extend beyond campus parameters.</span>
                </div>
              </div>
            </div>

            {/* Right Column: Platform Message Alert Banner */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0f0ff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
                  📢 Platform System Banner
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label htmlFor="input-system-message" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6666a0' }}>Global Warning Message</label>
                  <textarea
                    id="input-system-message"
                    placeholder="e.g. Surge prices active due to rain, expect minor delays..."
                    value={platformMessage}
                    onChange={e => setPlatformMessage(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px', color: '#f0f0ff', padding: '0.75rem', fontSize: '0.88rem',
                      resize: 'none', height: '120px', fontFamily: 'inherit', lineHeight: '1.4'
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#6666a0' }}>This warning will be displayed at the top of the dashboard pages for all student and driver profiles.</span>
                </div>
              </div>

              {/* Submit Banner info */}
              <div style={{ background: 'rgba(167, 139, 250, 0.02)', border: '1px dashed rgba(167, 139, 250, 0.15)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#a0a0cc', lineHeight: '1.5' }}>
                  ⚠️ <strong>Important Note:</strong> Saving system configurations will apply the surge updates, booking states, and warnings in real-time. Please review metrics before toggling maintenance modes.
                </div>
                <button
                  id="save-settings-btn"
                  type="submit"
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                    color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem',
                    fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(167, 139, 250, 0.25)', transition: 'all 0.2s',
                    width: '100%'
                  }}
                >
                  {saving ? 'Saving System Changes...' : '💾 Save & Apply System Settings'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
