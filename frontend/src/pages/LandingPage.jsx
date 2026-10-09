// src/pages/LandingPage.jsx
// Beautiful public landing page for SmartRideTIET

import { Link } from 'react-router-dom';
import tietLogo from '../assets/tiet_logo_icon.png';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <img src={tietLogo} className="brand-logo-img" alt="TIET Logo" />
          <span className="brand-name">SmartRide<span className="brand-tiet">TIET</span></span>
        </div>
        <div className="nav-links">
          <Link to="/login"    className="btn-outline">Login</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-badge">🎓 Campus Ride Sharing Platform</div>
        <h1 className="hero-title">
          Smart Rides for<br />
          <span className="gradient-text">TIET Students</span>
        </h1>
        <p className="hero-subtitle">
          Book a ride in seconds. Track your driver live. Pay seamlessly.<br />
          Built exclusively for Thapar Institute campus community.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn-hero-primary">
            🚀 Book Your First Ride
          </Link>
          <Link to="/login" className="btn-hero-outline">
            I have an account →
          </Link>
        </div>

        {/* Stats Row */}
        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-number">500+</span>
            <span className="stat-label">Students</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-number">50+</span>
            <span className="stat-label">Drivers</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-number">2000+</span>
            <span className="stat-label">Rides Done</span>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="features">
        <h2 className="section-title">Everything you need</h2>
        <p className="section-subtitle">Designed for campus life at TIET</p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>Live GPS Tracking</h3>
            <p>Track your driver in real-time on the map. Know exactly when they'll arrive.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Booking</h3>
            <p>Book a ride in under 30 seconds. No calls, no waiting, just tap and go.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Easy Payments</h3>
            <p>Pay via UPI, QR code, or wallet. Automatic fare calculation included.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Campus Safe</h3>
            <p>Only verified TIET students and drivers. Ride with confidence every time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🕐</div>
            <h3>Ride History</h3>
            <p>View all past rides, receipts, and expenses in one place.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Admin Dashboard</h3>
            <p>Real-time analytics, driver management, and ride oversight for admins.</p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-it-works">
        <h2 className="section-title">How it works</h2>
        <div className="steps-row">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Register with your TIET email as student or driver</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Book a Ride</h3>
            <p>Enter pickup & drop location on campus</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Matched</h3>
            <p>A nearby driver accepts your request instantly</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Ride & Pay</h3>
            <p>Track live, arrive safe, pay digitally</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to ride smarter?</h2>
          <p>Join hundreds of TIET students already using SmartRideTIET</p>
          <Link to="/register" className="btn-hero-primary">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <img src={tietLogo} className="footer-logo-img" alt="TIET Logo" />
          <span>SmartRideTIET</span>
        </div>
        <p>© 2025 SmartRideTIET · Built for Thapar Institute of Engineering & Technology</p>
      </footer>
    </div>
  );
};

export default LandingPage;
