// src/pages/ProfilePage.jsx
// Phase 2 — User Profile: view info, edit profile, driver vehicle settings

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../services/api';
import Navbar from '../components/common/Navbar';
import './ProfilePage.css';

const VEHICLE_TYPES = ['Car', 'Bike', 'Auto', 'Van'];

const ProfilePage = () => {
  const { profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('view'); // 'view' | 'edit'
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name:          profile?.name          || '',
    phone:         profile?.phone         || '',
    vehicleNumber: profile?.vehicleNumber || '',
    vehicleType:   profile?.vehicleType   || 'Car',
  });

  const role = profile?.role || 'student';

  // ── Get initials
  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name cannot be empty'); return; }

    try {
      setSaving(true);
      await updateMe(form);
      await refreshProfile();
      setSaved(true);
      toast.success('Profile updated! ✅');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <h1>My Profile</h1>
            <p>View and manage your account information</p>
          </div>

          <div className="profile-grid">
            {/* ── Left: Avatar Card ─────────────────── */}
            <div className="profile-card avatar-card">
              <div className="avatar-large">
                {profile?.photoURL
                  ? <img src={profile.photoURL} alt="avatar" />
                  : initials
                }
              </div>

              <div className="avatar-name">{profile?.name || 'User'}</div>
              <div className="avatar-email">{profile?.email}</div>

              <span className={`avatar-role-badge ${role}`}>
                {role === 'student' ? '🎓 Student'
                 : role === 'driver' ? '🚗 Driver'
                 : '⚙️ Admin'}
              </span>

              {/* Stats */}
              <div className="avatar-stats">
                <div className="stat-box">
                  <div className="stat-val">{profile?.totalRides ?? 0}</div>
                  <div className="stat-key">Total Rides</div>
                </div>
                <div className="stat-box">
                  <div className="stat-val">
                    {profile?.rating ? `${profile.rating.toFixed(1)}⭐` : 'New'}
                  </div>
                  <div className="stat-key">Rating</div>
                </div>
              </div>
            </div>

            {/* ── Right: Details / Edit ─────────────── */}
            <div className="profile-card details-card">
              {/* Tabs */}
              <div className="card-tabs">
                <button
                  id="tab-view"
                  className={`card-tab ${activeTab === 'view' ? 'active' : ''}`}
                  onClick={() => setActiveTab('view')}
                >
                  👤 View Profile
                </button>
                <button
                  id="tab-edit"
                  className={`card-tab ${activeTab === 'edit' ? 'active' : ''}`}
                  onClick={() => setActiveTab('edit')}
                >
                  ✏️ Edit Profile
                </button>
                {role === 'driver' && (
                  <button
                    id="tab-vehicle"
                    className={`card-tab ${activeTab === 'vehicle' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vehicle')}
                  >
                    🚗 Vehicle
                  </button>
                )}
              </div>

              {/* ── View Tab ──────────────────────── */}
              {activeTab === 'view' && (
                <div className="card-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Full Name</label>
                      <div className="info-value">{profile?.name || <span className="empty">Not set</span>}</div>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <div className="info-value">{profile?.email}</div>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <div className="info-value">
                        {profile?.phone || <span className="empty">Not set</span>}
                      </div>
                    </div>
                    <div className="info-item">
                      <label>Role</label>
                      <div className="info-value" style={{ textTransform: 'capitalize' }}>{role}</div>
                    </div>
                    <div className="info-item">
                      <label>Member Since</label>
                      <div className="info-value">{formatDate(profile?.createdAt)}</div>
                    </div>
                    <div className="info-item">
                      <label>Account Status</label>
                      <div className="info-value" style={{ color: profile?.isActive ? '#22c55e' : '#ef4444' }}>
                        {profile?.isActive ? '✅ Active' : '❌ Inactive'}
                      </div>
                    </div>

                    {role === 'driver' && (
                      <>
                        <div className="info-item">
                          <label>Vehicle Number</label>
                          <div className="info-value">
                            {profile?.vehicleNumber || <span className="empty">Not set</span>}
                          </div>
                        </div>
                        <div className="info-item">
                          <label>Vehicle Type</label>
                          <div className="info-value">
                            {profile?.vehicleType || <span className="empty">Not set</span>}
                          </div>
                        </div>
                        <div className="info-item">
                          <label>Total Earnings</label>
                          <div className="info-value" style={{ color: '#22c55e' }}>
                            ₹{profile?.earnings ?? 0}
                          </div>
                        </div>
                        <div className="info-item">
                          <label>Availability</label>
                          <div className="info-value" style={{ color: profile?.isAvailable ? '#22c55e' : '#ef4444' }}>
                            {profile?.isAvailable ? '🟢 Online' : '🔴 Offline'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Edit Tab ──────────────────────── */}
              {activeTab === 'edit' && (
                <div className="card-body">
                  <form className="edit-form" onSubmit={handleSave}>
                    {saved && (
                      <div className="save-success">
                        <CheckCircle size={16} /> Profile saved successfully!
                      </div>
                    )}

                    <div className="form-row-2">
                      <div className="field-group">
                        <label>Full Name *</label>
                        <input
                          id="edit-name"
                          className="field-input"
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div className="field-group">
                        <label>Phone Number</label>
                        <input
                          id="edit-phone"
                          className="field-input"
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label>Email (cannot change)</label>
                      <input
                        className="field-input"
                        type="email"
                        value={profile?.email || ''}
                        disabled
                      />
                    </div>

                    <button
                      id="btn-save-profile"
                      type="submit"
                      className="btn-save"
                      disabled={saving}
                    >
                      {saving ? <><span className="spinner" />Saving...</> : '💾 Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* ── Vehicle Tab (drivers only) ─────── */}
              {activeTab === 'vehicle' && role === 'driver' && (
                <div className="card-body">
                  <form className="edit-form" onSubmit={handleSave}>
                    {saved && (
                      <div className="save-success">
                        <CheckCircle size={16} /> Vehicle details saved!
                      </div>
                    )}

                    <div className="form-row-2">
                      <div className="field-group">
                        <label>Vehicle Number *</label>
                        <input
                          id="edit-vehicle-num"
                          className="field-input"
                          type="text"
                          name="vehicleNumber"
                          value={form.vehicleNumber}
                          onChange={handleChange}
                          placeholder="PB10AB1234"
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>
                      <div className="field-group">
                        <label>Vehicle Type</label>
                        <select
                          id="edit-vehicle-type"
                          className="field-input select-input"
                          name="vehicleType"
                          value={form.vehicleType}
                          onChange={handleChange}
                          style={{ background: '#16162a' }}
                        >
                          {VEHICLE_TYPES.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      id="btn-save-vehicle"
                      type="submit"
                      className="btn-save"
                      disabled={saving}
                    >
                      {saving ? <><span className="spinner" />Saving...</> : '🚗 Save Vehicle Info'}
                    </button>
                  </form>

                  {/* Danger Zone */}
                  <div className="danger-zone">
                    <h3>⚠️ Account Actions</h3>
                    <p>These actions affect your driver account permanently.</p>
                    <button
                      id="btn-deactivate"
                      className="btn-danger"
                      onClick={() => toast.error('Contact admin to deactivate your account.')}
                    >
                      Deactivate Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
