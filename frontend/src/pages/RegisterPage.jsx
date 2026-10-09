// src/pages/RegisterPage.jsx
// Phase 2 — Full Authentication: Registration with role selection (Student / Driver)

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  Car, AlertCircle, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import tietLogo from '../assets/tiet_logo_icon.png';
import tietLogoFull from '../assets/tiet_logo_full.png';
import './auth.css';

const VEHICLE_TYPES = ['Car', 'Bike', 'Auto', 'Van'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle } = useAuth();

  const [step, setStep] = useState(1); // 1 = role select, 2 = details form
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleNumber: '',
    vehicleType: 'Car',
  });

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  // ── Redirect by role
  const redirectByRole = (r) => {
    if (r === 'student') navigate('/student/dashboard');
    else if (r === 'driver') navigate('/driver/dashboard');
    else navigate('/');
  };

  // ── Email Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!formData.name.trim()) { setError('Full name is required.'); return; }
    if (!formData.email) { setError('Email is required.'); return; }
    if (!formData.phone) { setError('Phone number is required.'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    if (role === 'driver' && !formData.vehicleNumber.trim()) { setError('Vehicle number is required for drivers.'); return; }

    try {
      setLoading(true);
      await signUpWithEmail(formData.email, formData.password, {
        name: formData.name,
        phone: formData.phone,
        role,
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
      });
      toast.success('Account created! Welcome to SmartRideTIET 🎉');
      redirectByRole(role);
    } catch (err) {
      const msg = getFriendlyError(err.code);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Google Registration
  const handleGoogle = async () => {
    setError('');
    try {
      setGoogleLoading(true);
      await signInWithGoogle(role);
      toast.success('Signed up with Google! 🚀');
      redirectByRole(role);
    } catch (err) {
      const msg = getFriendlyError(err.code);
      setError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
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
            Join the<br />
            <span className="gradient">TIET Ride Network</span>
          </h2>
          <p>
            Create your free account today and start booking campus rides instantly. Safe, fast, and made for students.
          </p>

          <ul className="auth-features">
            <li>
              <span className="feat-icon">🎓</span>
              Exclusive for TIET community
            </li>
            <li>
              <span className="feat-icon">🚗</span>
              Student or Driver — your choice
            </li>
            <li>
              <span className="feat-icon">💰</span>
              Earn money as a campus driver
            </li>
            <li>
              <span className="feat-icon">📱</span>
              Works on web & mobile
            </li>
          </ul>
        </div>

        <div className="auth-float-card">
          <span className="card-icon">⭐</span>
          <div className="card-text">
            <strong>4.8 / 5 Rating</strong>
            from verified TIET students
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
            <h1>Create your account</h1>
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in instead →</Link>
            </p>
          </div>

          {/* Role Selector */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>I am joining as <span className="required">*</span></label>
            <div className="role-selector">
              <button
                id="role-student"
                type="button"
                className={`role-option ${role === 'student' ? 'selected' : ''}`}
                onClick={() => setRole('student')}
              >
                <span className="role-icon">🎓</span>
                <span className="role-name">Student</span>
                <span className="role-desc">Book campus rides</span>
              </button>
              <button
                id="role-driver"
                type="button"
                className={`role-option ${role === 'driver' ? 'selected' : ''}`}
                onClick={() => setRole('driver')}
              >
                <span className="role-icon">🚗</span>
                <span className="role-name">Driver</span>
                <span className="role-desc">Offer rides &amp; earn</span>
              </button>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            id="btn-google-register"
            className="btn-google"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            type="button"
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
            {googleLoading ? 'Creating account...' : `Continue as ${role === 'driver' ? 'Driver' : 'Student'} with Google`}
          </button>

          <div className="auth-divider">
            <span>or register with email</span>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Name + Phone */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-name">
                  Full name <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"><User size={16} /></span>
                  <input
                    id="reg-name"
                    className="form-input"
                    type="text"
                    name="name"
                    placeholder="Arjun Singh"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="reg-phone">
                  Phone <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"><Phone size={16} /></span>
                  <input
                    id="reg-phone"
                    className="form-input"
                    type="tel"
                    name="phone"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email">
                Email address <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><Mail size={16} /></span>
                <input
                  id="reg-email"
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

            {/* Password + Confirm */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-password">
                  Password <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={16} /></span>
                  <input
                    id="reg-password"
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="reg-confirm">
                  Confirm password <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    {formData.confirmPassword && formData.confirmPassword === formData.password
                      ? <CheckCircle size={16} style={{ color: '#22c55e' }} />
                      : <Lock size={16} />
                    }
                  </span>
                  <input
                    id="reg-confirm"
                    className="form-input"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowConfirm((p) => !p)}
                    aria-label="Toggle confirm password"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Driver-only fields */}
            {role === 'driver' && (
              <div className="driver-fields">
                <span className="driver-fields-label">🚗 Driver Details</span>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reg-vehicle-num">
                      Vehicle Number <span className="required">*</span>
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon"><Car size={16} /></span>
                      <input
                        id="reg-vehicle-num"
                        className="form-input"
                        type="text"
                        name="vehicleNumber"
                        placeholder="PB10AB1234"
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                        style={{ textTransform: 'uppercase' }}
                        required={role === 'driver'}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-vehicle-type">Vehicle Type</label>
                    <div className="input-wrapper">
                      <span className="input-icon" style={{ left: '0.8rem' }}>🚙</span>
                      <select
                        id="reg-vehicle-type"
                        className="form-input"
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        style={{ paddingLeft: '2.5rem', appearance: 'none', cursor: 'pointer' }}
                      >
                        {VEHICLE_TYPES.map((v) => (
                          <option key={v} value={v} style={{ background: '#1a1a2e' }}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-register-submit"
              type="submit"
              className="btn-auth-submit"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <><span className="spinner" />Creating account...</>
              ) : (
                `🎓 Create ${role === 'driver' ? 'Driver' : 'Student'} Account`
              )}
            </button>

            <p className="auth-terms">
              By creating an account, you agree to our{' '}
              <a href="#">Terms of Service</a> and{' '}
              <a href="#">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

// ── Firebase error → friendly message
function getFriendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password should be at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Google sign-up was cancelled.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

export default RegisterPage;
