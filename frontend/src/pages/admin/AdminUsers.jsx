// src/pages/admin/AdminUsers.jsx
// Phase 4 — Admin: User Management (view, search, change role, delete)

import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/common/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, changeUserRole, deleteUser } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

const ROLES = ['student', 'driver', 'admin'];
const ROLE_COLORS = {
  student: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  driver:  { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  admin:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

// ── Role Badge ─────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const { color, bg } = ROLE_COLORS[role] || { color: '#888', bg: 'rgba(136,136,136,0.1)' };
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}30`,
      borderRadius: '20px', padding: '0.22rem 0.75rem',
      fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {role === 'student' ? '🎓' : role === 'driver' ? '🚗' : '⚙️'} {role}
    </span>
  );
};

// ── Confirm Delete Modal ───────────────────────────────────────
const ConfirmModal = ({ user, onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      <div className="modal-icon">⚠️</div>
      <h3 className="modal-title">Delete User?</h3>
      <p className="modal-desc">
        This will permanently delete <strong>{user.name || user.email}</strong> and all their data.
        This action cannot be undone.
      </p>
      <div className="modal-actions">
        <button className="modal-cancel-btn" onClick={onCancel}>Cancel</button>
        <button className="modal-confirm-btn" onClick={onConfirm}>Yes, Delete</button>
      </div>
    </div>
  </div>
);

// ── Role Change Modal ──────────────────────────────────────────
const RoleModal = ({ user, onConfirm, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState(user.role);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">🔄</div>
        <h3 className="modal-title">Change Role</h3>
        <p className="modal-desc">Select a new role for <strong>{user.name || user.email}</strong>:</p>
        <div className="role-picker">
          {ROLES.map(r => (
            <button
              key={r}
              className={`role-pick-btn${selectedRole === r ? ' selected' : ''}`}
              style={selectedRole === r ? { background: ROLE_COLORS[r].bg, borderColor: ROLE_COLORS[r].color, color: ROLE_COLORS[r].color } : {}}
              onClick={() => setSelectedRole(r)}
            >
              {r === 'student' ? '🎓' : r === 'driver' ? '🚗' : '⚙️'} {r}
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onCancel}>Cancel</button>
          <button
            className="modal-confirm-btn"
            style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)' }}
            onClick={() => onConfirm(selectedRole)}
            disabled={selectedRole === user.role}
          >
            Update Role
          </button>
        </div>
      </div>
    </div>
  );
};

// ── User Card ──────────────────────────────────────────────────
const UserCard = ({ user, onRoleChange, onDelete, currentAdminId }) => {
  const initials = (user.name || user.email || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const roleStyle = ROLE_COLORS[user.role] || { color: '#888', bg: 'rgba(136,136,136,0.1)' };

  return (
    <div className="user-card" style={{ borderColor: `${roleStyle.color}20` }}>
      <div className="user-card-avatar" style={{ background: `${roleStyle.color}20`, color: roleStyle.color }}>
        {user.photoURL ? <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
      </div>
      <div className="user-card-info">
        <div className="user-card-name">{user.name || '—'}</div>
        <div className="user-card-email">{user.email || '—'}</div>
        {user.phone && <div className="user-card-phone">📞 {user.phone}</div>}
        {user.role === 'driver' && user.vehicleNumber && (
          <div className="user-card-vehicle">🚗 {user.vehicleNumber} · {user.vehicleType || '—'}</div>
        )}
        <div className="user-card-meta">
          Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}
          {user.totalRides != null && <span> · Rides: {user.totalRides}</span>}
          {user.earnings != null && <span> · ₹{user.earnings} earned</span>}
        </div>
      </div>
      <div className="user-card-actions">
        <RoleBadge role={user.role} />
        <button
          className="user-action-btn role-btn"
          onClick={() => onRoleChange(user)}
          title="Change role"
        >
          🔄 Change Role
        </button>
        {user.id !== currentAdminId && (
          <button
            className="user-action-btn delete-btn"
            onClick={() => onDelete(user)}
            title="Delete user"
          >
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────
const AdminUsers = () => {
  const { user: authUser } = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');   // all | student | driver | admin
  const [search, setSearch]         = useState('');
  const [deleteTarget, setDelete]   = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [busy, setBusy]             = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const roleParam = filter === 'all' ? undefined : filter;
      const res = await getAllUsers(roleParam);
      setUsers(res.users || []);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (newRole) => {
    if (!roleTarget) return;
    setBusy(true);
    try {
      await changeUserRole(roleTarget.id, newRole);
      toast.success(`Role updated to ${newRole}!`);
      setRoleTarget(null);
      fetchUsers();
    } catch (e) {
      toast.error(e?.error || 'Failed to change role');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success('User deleted!');
      setDelete(null);
      fetchUsers();
    } catch (e) {
      toast.error(e?.error || 'Failed to delete user');
    } finally {
      setBusy(false);
    }
  };

  const filtered = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q)
    );
  });

  const filterTabs = [
    { key: 'all',     label: 'All Users',  icon: '👥' },
    { key: 'student', label: 'Students',   icon: '🎓' },
    { key: 'driver',  label: 'Drivers',    icon: '🚗' },
    { key: 'admin',   label: 'Admins',     icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      {deleteTarget && (
        <ConfirmModal user={deleteTarget} onCancel={() => setDelete(null)} onConfirm={handleDelete} />
      )}
      {roleTarget && (
        <RoleModal user={roleTarget} onCancel={() => setRoleTarget(null)} onConfirm={handleRoleChange} />
      )}

      <div className="admin-page admin-with-sidebar" style={{ flex: 1, paddingTop: '0' }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div>
              <h1 className="admin-title">User Management <span>👥</span></h1>
              <p className="admin-subtitle">{users.length} total users — search, filter, and manage roles</p>
            </div>
            <button className="admin-refresh-btn" onClick={fetchUsers}>↻ Refresh</button>
          </div>

          {/* Search + Filter */}
          <div className="admin-controls">
            <input
              id="user-search"
              type="text"
              className="admin-search"
              placeholder="🔍  Search by name, email or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="admin-filter-tabs">
              {filterTabs.map(t => (
                <button
                  key={t.key}
                  className={`filter-tab${filter === t.key ? ' active' : ''}`}
                  onClick={() => setFilter(t.key)}
                >
                  {t.icon} {t.label}
                  <span className="filter-count">
                    {t.key === 'all' ? users.length : users.filter(u => u.role === t.key).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="admin-loading-inline">
              <div className="admin-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">No users found.</div>
          ) : (
            <div className="users-list">
              {filtered.map(u => (
                <UserCard
                  key={u.id}
                  user={u}
                  onRoleChange={setRoleTarget}
                  onDelete={setDelete}
                  currentAdminId={authUser?.uid}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
