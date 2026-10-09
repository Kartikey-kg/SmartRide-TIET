// src/components/common/AdminSidebar.jsx
// Phase 6 — Collapsible and Drag-to-Resize sidebar for all admin pages

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import tietLogo from '../../assets/tiet_logo_icon.png';
import './AdminSidebar.css';

const NAV_GROUPS = [
  {
    section: 'Overview',
    links: [
      { to: '/admin/dashboard',  icon: '🏠', label: 'Dashboard'      },
      { to: '/admin/monitor',    icon: '📡', label: 'Live Monitor'   },
    ],
  },
  {
    section: 'Analytics',
    links: [
      { to: '/admin/analytics',  icon: '📊', label: 'Analytics'      },
      { to: '/admin/revenue',    icon: '💰', label: 'Revenue Report' },
    ],
  },
  {
    section: 'Management',
    links: [
      { to: '/admin/users',         icon: '👥', label: 'Users'          },
      { to: '/admin/rides',         icon: '🚕', label: 'All Rides'      },
      { to: '/admin/drivers',       icon: '🚗', label: 'Driver Verify'  },
      { to: '/admin/notifications', icon: '🔔', label: 'Notifications'  },
    ],
  },
  {
    section: 'System',
    links: [
      { to: '/admin/settings', icon: '⚙️', label: 'Settings'   },
      { to: '/admin/profile',  icon: '👤', label: 'My Profile' },
    ],
  },
];

const AdminSidebar = () => {
  const { pathname }            = useLocation();
  const { profile, logout }     = useAuth();
  
  // Retrieve saved configuration from local storage
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-width');
    return saved ? parseInt(saved, 10) : 240;
  });
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });
  const [isResizing, setIsResizing] = useState(false);

  // Sync layout width to global CSS custom variable
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', collapsed);
    if (collapsed) {
      document.documentElement.style.setProperty('--asb-width', '64px');
    } else {
      document.documentElement.style.setProperty('--asb-width', `${width}px`);
    }
  }, [collapsed, width]);

  // Handle document transition disable triggers
  useEffect(() => {
    if (isResizing) {
      document.body.classList.add('asb-resizing');
    } else {
      document.body.classList.remove('asb-resizing');
    }
    return () => {
      document.body.classList.remove('asb-resizing');
    };
  }, [isResizing]);

  const initials = (profile?.name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Drag-to-Resize mouse event triggers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth + deltaX;

      // Impose boundaries on panel width
      if (newWidth < 180) newWidth = 180;
      if (newWidth > 450) newWidth = 450;

      setWidth(newWidth);
      localStorage.setItem('admin-sidebar-width', newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {!collapsed && <div className="asb-overlay" onClick={() => setCollapsed(true)} />}

      <aside 
        className={`asb-root${collapsed ? ' asb-collapsed' : ''}${isResizing ? ' asb-resizing' : ''}`}
        style={{ width: collapsed ? '64px' : `${width}px` }}
      >
        {/* Brand */}
        <div className="asb-brand">
          <img src={tietLogo} className="asb-brand-logo" alt="TIET Logo" />
          {!collapsed && (
            <span className="asb-brand-text">
              Smart<span>Ride</span>TIET
            </span>
          )}
          <button
            id="asb-toggle-btn"
            className="asb-toggle"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={collapsed ? { marginLeft: '0' } : {}}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Admin badge */}
        {!collapsed && (
          <div className="asb-admin-badge">
            <div className="asb-avatar">{initials}</div>
            <div className="asb-admin-info">
              <div className="asb-admin-name">{profile?.name?.split(' ')[0] || 'Admin'}</div>
              <div className="asb-admin-role">⚙️ Administrator</div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="asb-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.section} className="asb-group">
              {!collapsed && (
                <div className="asb-section-label">{group.section}</div>
              )}
              {group.links.map(link => {
                const active = pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    id={`asb-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`asb-link${active ? ' asb-link-active' : ''}`}
                    title={collapsed ? link.label : ''}
                  >
                    <span className="asb-link-icon">{link.icon}</span>
                    {!collapsed && <span className="asb-link-label">{link.label}</span>}
                    {active && !collapsed && <span className="asb-link-dot" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom logout */}
        <div className="asb-footer">
          <button
            id="asb-logout-btn"
            className="asb-logout"
            onClick={logout}
            title="Logout"
          >
            <span>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Drag Resize Handle */}
        {!collapsed && (
          <div 
            className="asb-resize-handle" 
            onMouseDown={handleMouseDown}
            title="Drag to resize panel"
          />
        )}
      </aside>
    </>
  );
};

export default AdminSidebar;
