// src/pages/LoginPage.jsx
// Phase 2 — Full Authentication: Login with Email + Google

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import tietLogo from '../assets/tiet_logo_icon.png';
import tietLogoFull from '../assets/tiet_logo_full.png';
import './auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Redirect helper based on role
  const redirectByRole = (role) => {
    if (role === 'student') navigate('/student/dashboard');
    else if (role === 'driver') navigate('/driver/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/');
  };

  // ── Email Sign-In
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      const { profile } = await signInWithEmail(formData.email, formData.password);
      toast.success(`Welcome back! 🎉`);
      redirectByRole(profile?.role);
    } catch (err) {
      const msg = getFriendlyError(err.code);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In
  const handleGoogle = async () => {
    setError('');
    try {
      setGoogleLoading(true);
      const { profile } = await signInWithGoogle();
      toast.success(`Signed in with Google! 🚀`);
      redirectByRole(profile?.role);
    } catch (err) {
      const msg = getFriendlyError(err.code);
      setError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  return (
    <div className="auth-page">
      {/* ── Left Panel ──────────────────────── */}
      <div className="auth-left">
        <div className="auth-brand">
          <img src={tietLogo} className="auth-brand-logo" alt="TIET Logo" />
          <span className="auth-brand-name">SmartRide<span>TIET</span></span>
        </div>

        <div className="auth-left-content">
          <h2>
            Welcome back to<br />
            <span className="gradient">SmartRideTIET</span>
          </h2>
          <p>
            Your campus ride-sharing platform. Book rides, track your driver live, and pay digitally — all in one place.
          </p>

          <ul className="auth-features">
            <li>
              <span className="feat-icon">📍</span>
              Real-time GPS tracking
            </li>
            <li>
              <span className="feat-icon">⚡</span>
              Book a ride in under 30 seconds
            </li>
            <li>
              <span className="feat-icon">💳</span>
              Razorpay-powered payments
            </li>
            <li>
              <span className="feat-icon">🛡️</span>
              TIET verified students only
            </li>
          </ul>
        </div>

        <div className="auth-float-card">
          <span className="card-icon">🎓</span>
          <div className="card-text">
            <strong>2,000+ Rides</strong>
            completed by TIET students
          </div>
        </div>

        <div className="auth-left-footer">
          <img src={tietLogoFull} className="auth-university-logo" alt="Thapar Institute Logo" />
        </div>
      </div>

      {/* ── Right Panel (Form) ──────────────── */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>Sign in to your account</h1>
            <p>
              Don't have an account?{' '}
              <Link to="/register">Create one free →</Link>
            </p>
          </div>

          {/* Google Sign In */}
          <button
            id="btn-google-login"
            className="btn-google"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <span className="spinner" />
            ) : (
              <svg className="google-logo" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          {/* Error message */}
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Email Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email">
                Email address <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><Mail size={16} /></span>
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  name="email"
                  placeholder="yourname@tiet.ac.in"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password">
                Password <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  id="login-password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="btn-login-submit"
              type="submit"
              className="btn-auth-submit"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <><span className="spinner" />Signing in...</>
              ) : (
                '🔐 Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Firebase error code → friendly message
function getFriendlyError(code) {
  const map = {
    'auth/user-not-found':     'No account found with this email.',
    'auth/wrong-password':     'Incorrect password. Please try again.',
    'auth/invalid-email':      'Please enter a valid email address.',
    'auth/too-many-requests':  'Too many failed attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/invalid-credential': 'Invalid email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

export default LoginPage;
