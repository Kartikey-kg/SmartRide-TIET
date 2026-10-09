// src/App.jsx
// Root app with all routes defined — SmartRideTIET

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// ── Public Pages ────────────────────────────────────────────
import LandingPage   from './pages/LandingPage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';

// ── Shared Auth Pages ───────────────────────────────────────
import ProfilePage   from './pages/ProfilePage';

// ── Student Pages ───────────────────────────────────────────
import StudentDashboard from './pages/student/StudentDashboard';
import BookRide         from './pages/student/BookRide';
import RideHistory      from './pages/student/RideHistory';
import CampusMap        from './pages/student/CampusMap';
import PaymentPage      from './pages/student/PaymentPage';
import WalletPage       from './pages/student/WalletPage';

// ── Driver Pages ────────────────────────────────────────────
import DriverDashboard  from './pages/driver/DriverDashboard';
import AvailableRides   from './pages/driver/AvailableRides';
import DriverEarnings   from './pages/driver/DriverEarnings';

// ── Admin Pages ─────────────────────────────────────────────
import AdminDashboard   from './pages/admin/AdminDashboard';
import AdminRides       from './pages/admin/AdminRides';
import AdminUsers       from './pages/admin/AdminUsers';
import AdminAnalytics   from './pages/admin/AdminAnalytics';
import AdminRevenueReport from './pages/admin/AdminRevenueReport';
import AdminDriverVerification from './pages/admin/AdminDriverVerification';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings     from './pages/admin/AdminSettings';
import AdminLiveMonitor  from './pages/admin/AdminLiveMonitor';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1a1a2e',
              color: '#d0d0f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem',
            },
          }}
        />

        <Routes>
          {/* ── Public Routes ────────────────────────────────── */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Student Routes ───────────────────────────────── */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/book" element={
            <ProtectedRoute allowedRoles={['student']}>
              <BookRide />
            </ProtectedRoute>
          } />
          <Route path="/student/history" element={
            <ProtectedRoute allowedRoles={['student']}>
              <RideHistory />
            </ProtectedRoute>
          } />
          <Route path="/student/campus-map" element={
            <ProtectedRoute allowedRoles={['student']}>
              <CampusMap />
            </ProtectedRoute>
          } />
          <Route path="/student/payment/:rideId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <PaymentPage />
            </ProtectedRoute>
          } />
          <Route path="/student/wallet" element={
            <ProtectedRoute allowedRoles={['student']}>
              <WalletPage />
            </ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* ── Driver Routes ────────────────────────────────── */}
          <Route path="/driver/dashboard" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverDashboard />
            </ProtectedRoute>
          } />
          <Route path="/driver/available" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <AvailableRides />
            </ProtectedRoute>
          } />
          <Route path="/driver/earnings" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverEarnings />
            </ProtectedRoute>
          } />
          <Route path="/driver/profile" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* ── Admin Routes ─────────────────────────────────── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/rides" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRides />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/admin/revenue" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRevenueReport />
            </ProtectedRoute>
          } />
          <Route path="/admin/drivers" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDriverVerification />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminNotifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSettings />
            </ProtectedRoute>
          } />
          <Route path="/admin/monitor" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLiveMonitor />
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* ── 404 Fallback ─────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
