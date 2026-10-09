// src/pages/admin/AdminNotifications.jsx
// Phase 6 — Notifications Center: compose and send platform-wide alerts, review logs

import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/common/AdminSidebar';
import { broadcastNotification, getNotifications, deleteNotification } from '../../services/api';
import toast from 'react-hot-toast';
import './AdminAnalytics.css';

const AdminNotifications = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all'); // all | students | drivers
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotifications(20);
      setNotifications(res.notifications || []);
    } catch (e) {
      toast.error('Failed to load past broadcasts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      return toast.error('Both title and message are required.');
    }
    setSending(true);
    const loadId = toast.loading('Publishing broadcast...');
    try {
      await broadcastNotification({ title, message, target });
      toast.success('Announcement broadcasted successfully!', { id: loadId });
      setTitle('');
      setMessage('');
      setTarget('all');
      fetchNotifications();
    } catch (e) {
      toast.error(e?.error || 'Failed to dispatch notification', { id: loadId });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    const loadId = toast.loading('Deleting announcement...');
    try {
      await deleteNotification(id);
      toast.success('Broadcast announcement deleted.', { id: loadId });
      fetchNotifications();
    } catch (e) {
      toast.error('Failed to delete announcement', { id: loadId });
    }
  };

  const formatTarget = (t) => {
    if (t === 'all') return '👥 Everyone';
    if (t === 'students') return '🎓 Students Only';
    if (t === 'drivers') return '🚗 Drivers Only';
    return t;
  };

  return (
    <div className="analytics-layout">
      <AdminSidebar />
      <div className="analytics-main admin-with-sidebar">
        <div className="analytics-header">
          <div>
            <h1 className="analytics-title">🔔 Notification & Broadcast Center</h1>
            <p className="analytics-sub">Dispatch system-wide alerts, safety updates and operational announcements</p>
          </div>
          <button className="admin-refresh-btn" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#a0a0cc', cursor: 'pointer' }} onClick={fetchNotifications}>
            ↻ Refresh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Form Card */}
          <div style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✍️</span> Compose Broadcast Announcement
            </h3>
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6666a0' }}>Target Audience</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { key: 'all', label: 'Everyone', icon: '👥' },
                    { key: 'students', label: 'Students', icon: '🎓' },
                    { key: 'drivers', label: 'Drivers', icon: '🚗' }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTarget(opt.key)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: target === opt.key ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.02)',
                        borderColor: target === opt.key ? '#a78bfa' : 'rgba(255,255,255,0.08)',
                        color: target === opt.key ? '#a78bfa' : '#a0a0cc',
                        padding: '0.55rem', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s'
                      }}
                    >
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="broadcast-title" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6666a0' }}>Announcement Title</label>
                <input
                  id="broadcast-title"
                  type="text"
                  placeholder="e.g. Server Maintenance tonight or Heavy rain warning..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', color: '#f0f0ff', padding: '0.75rem', fontSize: '0.88rem',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label htmlFor="broadcast-message" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6666a0' }}>Message Details</label>
                <textarea
                  id="broadcast-message"
                  placeholder="Type the message contents that target audience will receive..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', color: '#f0f0ff', padding: '0.75rem', fontSize: '0.88rem',
                    resize: 'none', height: '140px', fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <button
                id="send-broadcast-btn"
                type="submit"
                disabled={sending}
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                  color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem',
                  fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem',
                  boxShadow: '0 4px 12px rgba(167, 139, 250, 0.25)', transition: 'all 0.2s'
                }}
              >
                {sending ? 'Dispatching Broadcast...' : '📣 Send Broadcast Now'}
              </button>
            </form>
          </div>

          {/* Past Alerts Card */}
          <div style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '2rem', height: '560px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🕒</span> Broadcast Logs
            </h3>
            {loading ? (
              <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#6666a0', fontSize: '0.9rem' }}>
                <div className="asb-spinner" />
                <span>Loading logs…</span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#555580' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <span>No announcements published yet.</span>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                    position: 'relative'
                  }}>
                    <button
                      onClick={() => handleDelete(n.id)}
                      style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        background: 'transparent', border: 'none', color: '#ef4444',
                        cursor: 'pointer', fontSize: '0.9rem', opacity: 0.6, transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.target.style.opacity = '1'}
                      onMouseLeave={e => e.target.style.opacity = '0.6'}
                      title="Delete broadcast log"
                    >
                      🗑
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                        background: 'rgba(255,255,255,0.05)', color: '#a0a0cc', padding: '0.2rem 0.5rem', borderRadius: '4px'
                      }}>
                        {formatTarget(n.target)}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#4a4a80' }}>
                        {n.sentAt ? new Date(n.sentAt).toLocaleString('en-IN') : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f0ff', paddingRight: '1.5rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a0a0cc', lineHeight: '1.4' }}>{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
