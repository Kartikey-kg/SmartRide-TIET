// src/components/common/ProtectedRoute.jsx
// Phase 2 — Route guard: redirects unauthenticated users to /login
// Also handles role-based access control

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Usage:
 *   <ProtectedRoute allowedRoles={['student']}>
 *     <StudentDashboard />
 *   </ProtectedRoute>
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Show a full-screen loading spinner while Firebase resolves auth
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0d1a',
        gap: '1.5rem',
      }}>
        {/* Animated bus icon */}
        <div style={{ fontSize: '3rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
          🚌
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(124, 58, 237, 0.2)',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#6666aa', fontSize: '0.9rem' }}>
          Loading SmartRideTIET...
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.9); }
          }
        `}</style>
      </div>
    );
  }

  // Not logged in → redirect to login, remember where they came from
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but profile not yet loaded → show spinner while Firestore resolves
  if (!profile && allowedRoles.length > 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0d1a',
        gap: '1.5rem',
      }}>
        <div style={{ fontSize: '3rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
          🚌
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(124, 58, 237, 0.2)',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#6666aa', fontSize: '0.9rem' }}>
          Loading your profile...
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.9); }
          }
        `}</style>
      </div>
    );
  }

  // Role check — if allowedRoles specified, enforce it
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    // Redirect to their own dashboard instead of an error page
    const roleRedirect = {
      student: '/student/dashboard',
      driver:  '/driver/dashboard',
      admin:   '/admin/dashboard',
    };
    const fallback = roleRedirect[profile?.role] || '/';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
