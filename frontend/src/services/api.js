// src/services/api.js
// Central Axios API client — all backend API calls go through here

import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────
// Automatically attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ─── Response Interceptor ─────────────────────────────────────
// Handle global errors (401 = redirect to login)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired → sign out
      auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ─── API Functions ────────────────────────────────────────────

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const getMe = ()          => api.get('/auth/me');
export const updateMe = (data)   => api.put('/auth/me', data);

// Rides
export const bookRide         = (data)  => api.post('/rides/book', data);
export const getMyRides       = ()      => api.get('/rides/my');
export const getRideById      = (id)    => api.get(`/rides/${id}`);
export const acceptRide       = (id)    => api.put(`/rides/${id}/accept`);
export const completeRide     = (id)    => api.put(`/rides/${id}/complete`);
export const cancelRide       = (id)    => api.put(`/rides/${id}/cancel`);
export const getAvailableRides = ()     => api.get('/rides/driver/available');

// Users
export const getAllDrivers = ()   => api.get('/users/drivers');
export const getUserById  = (id) => api.get(`/users/${id}`);

// Admin — Phase 1–5
export const getDashboardStats  = ()          => api.get('/admin/stats');
export const getAllRides         = (status)    => api.get('/admin/rides', { params: { status } });
export const getAllUsers         = (role)      => api.get('/admin/users', { params: { role } });
export const changeUserRole     = (id, role)  => api.put(`/admin/users/${id}/role`, { role });
export const deleteUser         = (id)        => api.delete(`/admin/users/${id}`);
export const getAdminAnalytics  = ()          => api.get('/admin/analytics');
export const cancelRideAdmin    = (id)        => api.put(`/admin/rides/${id}/cancel`);

// Admin — Phase 6
export const getAdvancedAnalytics  = (period) => api.get('/admin/analytics/advanced', { params: { period } });
export const getRevenueReport      = ()        => api.get('/admin/analytics/revenue');
export const getPendingDrivers     = ()        => api.get('/admin/drivers/pending');
export const verifyDriver          = (id, verified, rejectionReason) =>
  api.put(`/admin/drivers/${id}/verify`, { verified, rejectionReason });
export const broadcastNotification = (data)    => api.post('/admin/notifications', data);
export const getNotifications      = (limit)   => api.get('/admin/notifications', { params: { limit } });
export const deleteNotification    = (id)      => api.delete(`/admin/notifications/${id}`);
export const getSystemSettings     = ()        => api.get('/admin/settings');
export const updateSystemSettings  = (data)    => api.put('/admin/settings', data);
export const getLiveRides          = ()        => api.get('/admin/monitor');
export const exportRidesCSV        = ()        =>
  api.get('/admin/export/rides', { responseType: 'blob' });
export const exportUsersCSV        = ()        =>
  api.get('/admin/export/users', { responseType: 'blob' });

// Payments — Razorpay
export const createPaymentOrder    = (rideId)  => api.post('/payments/create-order', { rideId, type: 'ride' });
export const verifyRazorpayPayment = (data)    => api.post('/payments/verify', data);
export const createTopupOrder      = (amount)  => api.post('/payments/create-order', { type: 'wallet', amount });

// Wallet
export const getWalletBalance      = ()        => api.get('/payments/wallet/balance');
export const getWalletTransactions = (limit)   => api.get('/payments/wallet/transactions', { params: { limit } });
export const walletPay             = (rideId)  => api.post('/payments/wallet/pay', { rideId });

// Payment History
export const getPaymentHistory     = (limit)   => api.get('/payments/history', { params: { limit } });

// ML Predictions — Phase 7
export const getMLPredictions      = ()        => api.get('/ml/all');

export default api;
