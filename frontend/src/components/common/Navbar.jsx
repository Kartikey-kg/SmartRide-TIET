// src/components/common/Navbar.jsx
// Phase 2 — Authenticated app navbar with role-aware links, user dropdown, and logout

import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Car, Clock, Users, BarChart2,
  User, LogOut, Settings, ChevronDown, Menu, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import tietLogo from '../../assets/tiet_logo_icon.png';
import './Navbar.css';

// ── Nav links per role ───────────────────────────────────────
const NAV_LINKS = {
  student: [
    { to: '/student/dashboard', icon: <Home size={15} />,  label: 'Dashboard' },
    { to: '/student/book',      icon: <Car size={15} />,   label: 'Book Ride' },
    { to: '/student/history',   icon: <Clock size={15} />, label: 'My Rides' },
  ],
  driver: [
    { to: '/driver/dashboard',  icon: <Home size={15} />,     label: 'Dashboard' },
    { to: '/driver/available',  icon: <Car size={15} />,      label: 'Available Rides' },
    { to: '/driver/earnings',   icon: <BarChart2 size={15} />, label: 'Earnings' },
  ],
  admin: [
    { to: '/admin/dashboard',   icon: <BarChart2 size={15} />, label: 'Dashboard' },
    { to: '/admin/rides',       icon: <Car size={15} />,       label: 'Rides' },
    { to: '/admin/users',       icon: <Users size={15} />,     label: 'Users' },
  ],
};

const Navbar = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const role = profile?.role || 'student';
  const links = NAV_LINKS[role] || [];

  // ── Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Close mobile nav on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    toast.success('Logged out successfully 👋');
    navigate('/');
  };

  // ── Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <Link to={`/${role}/dashboard`} className="navbar-brand">
          <img src={tietLogo} className="navbar-brand-logo" alt="TIET Logo" />
          <span className="navbar-brand-name">
            SmartRide<span>TIET</span>
          </span>
        </Link>

        {/* Center nav links */}
        <div className="navbar-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* Role badge */}
          <span className={`role-badge ${role}`}>
            {role === 'student' ? '🎓 Student' : role === 'driver' ? '🚗 Driver' : '⚙️ Admin'}
          </span>

          {/* User avatar dropdown */}
          <div className="user-menu-wrapper" ref={dropdownRef}>
            <button
              id="navbar-user-menu"
              className="user-avatar-btn"
              onClick={() => setDropdownOpen((p) => !p)}
              aria-label="User menu"
            >
              <div className="user-avatar">
                {profile?.photoURL
                  ? <img src={profile.photoURL} alt="avatar" />
                  : getInitials(profile?.name)
                }
              </div>
              <span className="user-name">{profile?.name?.split(' ')[0] || 'User'}</span>
              <ChevronDown size={14} className={`chevron-icon${dropdownOpen ? ' open' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="user-dropdown" role="menu">
                <div className="dropdown-header">
                  <div className="dropdown-name">{profile?.name || 'User'}</div>
                  <div className="dropdown-email">{profile?.email}</div>
                </div>

                <div className="dropdown-items">
                  <Link
                    id="nav-profile-link"
                    to={`/${role}/profile`}
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={15} /> My Profile
                  </Link>
                  <Link
                    id="nav-settings-link"
                    to={`/${role}/settings`}
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={15} /> Settings
                  </Link>

                  <div className="dropdown-divider" />

                  <button
                    id="nav-logout-btn"
                    className="dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="hamburger"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X size={20} color="#c0c0e0" /> : <Menu size={20} color="#8888aa" />}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="mobile-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          <div className="dropdown-divider" style={{ margin: '0.5rem 0' }} />
          <button className="nav-link danger" onClick={handleLogout} style={{ color: '#f87171' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar;
