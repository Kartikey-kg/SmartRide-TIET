const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// All admin routes require verifyToken + admin role
router.use(verifyToken, requireRole('admin'));

// ── Phase 1–5 ─────────────────────────────────────────────────

// GET  /api/admin/stats       → Dashboard stats (total rides, users, revenue)
router.get('/stats', adminController.getDashboardStats);

// GET  /api/admin/rides        → All rides with filters
router.get('/rides', adminController.getAllRides);

// GET  /api/admin/users        → All users (students + drivers)
router.get('/users', adminController.getAllUsers);

// PUT  /api/admin/users/:id/role → Change user role
router.put('/users/:id/role', adminController.changeUserRole);

// DELETE /api/admin/users/:id  → Delete a user
router.delete('/users/:id', adminController.deleteUser);

// GET  /api/admin/analytics    → Last-7-days ride counts for charts
router.get('/analytics', adminController.getAnalytics);

// PUT  /api/admin/rides/:id/cancel → Admin cancels a ride
router.put('/rides/:id/cancel', adminController.cancelRideAdmin);

// ── Phase 6 ───────────────────────────────────────────────────

// GET  /api/admin/analytics/advanced  → Advanced bucketed analytics (7 or 30 days)
router.get('/analytics/advanced', adminController.getAdvancedAnalytics);

// GET  /api/admin/analytics/revenue   → Revenue breakdown + top drivers
router.get('/analytics/revenue', adminController.getRevenueReport);

// GET  /api/admin/drivers/pending     → All drivers with verification status
router.get('/drivers/pending', adminController.getPendingDrivers);

// PUT  /api/admin/drivers/:id/verify  → Approve or reject a driver
router.put('/drivers/:id/verify', adminController.verifyDriver);

// POST /api/admin/notifications       → Broadcast notification
router.post('/notifications', adminController.broadcastNotification);

// GET  /api/admin/notifications       → List past broadcasts
router.get('/notifications', adminController.getNotifications);

// DELETE /api/admin/notifications/:id → Delete a notification
router.delete('/notifications/:id', adminController.deleteNotification);

// GET  /api/admin/settings            → Read platform settings
router.get('/settings', adminController.getSystemSettings);

// PUT  /api/admin/settings            → Update platform settings
router.put('/settings', adminController.updateSystemSettings);

// GET  /api/admin/export/rides        → CSV export of all rides
router.get('/export/rides', adminController.exportRidesCSV);

// GET  /api/admin/export/users        → CSV export of all users
router.get('/export/users', adminController.exportUsersCSV);

// GET  /api/admin/monitor             → Live active rides feed
router.get('/monitor', adminController.getLiveRides);

module.exports = router;
