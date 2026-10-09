const { db, auth } = require('../config/firebase');

/**
 * GET /api/admin/stats
 * Dashboard overview statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const [usersSnap, ridesSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('rides').get(),
    ]);

    let students = 0, drivers = 0, totalRevenue = 0;
    let pending = 0, completed = 0, cancelled = 0;

    usersSnap.forEach(doc => {
      const data = doc.data();
      if (data.role === 'student') students++;
      if (data.role === 'driver') drivers++;
    });

    ridesSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === 'pending')   pending++;
      if (data.status === 'completed') { completed++; totalRevenue += (data.fare || 0); }
      if (data.status === 'cancelled') cancelled++;
    });

    res.json({
      stats: {
        totalUsers:    usersSnap.size,
        students,
        drivers,
        totalRides:    ridesSnap.size,
        pendingRides:  pending,
        completedRides: completed,
        cancelledRides: cancelled,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/rides
 * Get all rides with optional status filter
 */
const getAllRides = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db.collection('rides').orderBy('createdAt', 'desc').limit(100);

    if (status) {
      query = db.collection('rides').where('status', '==', status).orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ rides });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/users
 * Get all users with optional role filter
 */
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = db.collection('users').orderBy('createdAt', 'desc');

    if (role) {
      query = db.collection('users').where('role', '==', role);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Change a user's role
 */
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['student', 'driver', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    await db.collection('users').doc(req.params.id).update({
      role,
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: `User role changed to ${role}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Admin deletes a user
 */
const deleteUser = async (req, res) => {
  try {
    const uid = req.params.id;
    await db.collection('users').doc(uid).delete();
    await auth.deleteUser(uid);

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/analytics
 * Returns last-7-days ride counts + revenue per day
 */
const getAnalytics = async (req, res) => {
  try {
    const snapshot = await db.collection('rides').get();
    const now = new Date();
    // Build buckets for last 7 days
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return { date: d.toISOString().slice(0, 10), rides: 0, revenue: 0 };
    });

    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.createdAt) return;
      const dayStr = data.createdAt.slice(0, 10);
      const bucket = buckets.find(b => b.date === dayStr);
      if (bucket) {
        bucket.rides++;
        if (data.status === 'completed') bucket.revenue += (data.fare || 0);
      }
    });

    res.json({ analytics: buckets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/admin/rides/:id/cancel
 * Admin cancels any non-terminal ride
 */
const cancelRideAdmin = async (req, res) => {
  try {
    const rideRef = db.collection('rides').doc(req.params.id);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) return res.status(404).json({ error: 'Ride not found.' });

    const { status } = rideDoc.data();
    if (['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: `Cannot cancel a ${status} ride.` });
    }

    await rideRef.update({
      status:      'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      cancelledBy: req.user.uid,
      cancelNote:  'Cancelled by admin',
    });

    res.json({ message: 'Ride cancelled by admin.', rideId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════
//  PHASE 6 — NEW ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/analytics/advanced
 * Advanced analytics: rides + revenue bucketed for 7 or 30 days
 * Query: ?period=7 (default) or ?period=30
 */
const getAdvancedAnalytics = async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 7;
    const days   = Math.min(Math.max(period, 7), 30);

    const snapshot = await db.collection('rides').get();
    const now      = new Date();

    // Build daily buckets
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return { date: d.toISOString().slice(0, 10), label, rides: 0, revenue: 0, completed: 0, cancelled: 0 };
    });

    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.createdAt) return;
      const dayStr = data.createdAt.slice(0, 10);
      const bucket = buckets.find(b => b.date === dayStr);
      if (!bucket) return;
      bucket.rides++;
      if (data.status === 'completed') { bucket.completed++; bucket.revenue += (data.fare || 0); }
      if (data.status === 'cancelled') bucket.cancelled++;
    });

    // Aggregate totals for KPIs
    const totalRides     = buckets.reduce((s, b) => s + b.rides, 0);
    const totalRevenue   = buckets.reduce((s, b) => s + b.revenue, 0);
    const avgDailyRides  = (totalRides / days).toFixed(1);
    const peakBucket     = buckets.reduce((max, b) => b.rides > max.rides ? b : max, buckets[0]);

    res.json({
      period: days,
      buckets,
      kpis: {
        totalRides,
        totalRevenue,
        avgDailyRides,
        peakDay:      peakBucket?.date || null,
        peakDayLabel: peakBucket?.label || null,
        peakRides:    peakBucket?.rides || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/analytics/revenue
 * Revenue breakdown: by payment method, top earning drivers
 */
const getRevenueReport = async (req, res) => {
  try {
    const [ridesSnap, usersSnap] = await Promise.all([
      db.collection('rides').where('status', '==', 'completed').get(),
      db.collection('users').where('role', '==', 'driver').get(),
    ]);

    let razorpayTotal = 0, walletTotal = 0;
    const driverEarnings = {};

    ridesSnap.forEach(doc => {
      const d = doc.data();
      const fare = d.fare || 0;
      if (d.paymentMethod === 'wallet') walletTotal += fare;
      else razorpayTotal += fare;

      if (d.driverId) {
        driverEarnings[d.driverId] = (driverEarnings[d.driverId] || { earnings: 0, rides: 0 });
        driverEarnings[d.driverId].earnings += fare;
        driverEarnings[d.driverId].rides++;
        driverEarnings[d.driverId].name = d.driverName || 'Unknown';
      }
    });

    // Top 5 drivers
    const topDrivers = Object.entries(driverEarnings)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    // Last 30-day daily revenue
    const now = new Date();
    const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return { date: d.toISOString().slice(0, 10), label, amount: 0 };
    });

    ridesSnap.forEach(doc => {
      const d = doc.data();
      if (!d.createdAt) return;
      const bucket = dailyRevenue.find(b => b.date === d.createdAt.slice(0, 10));
      if (bucket) bucket.amount += (d.fare || 0);
    });

    res.json({
      summary: {
        totalRevenue: razorpayTotal + walletTotal,
        razorpayTotal,
        walletTotal,
        totalCompletedRides: ridesSnap.size,
      },
      topDrivers,
      dailyRevenue,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/drivers/pending
 * All drivers with verified !== true
 */
const getPendingDrivers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'driver').get();
    const drivers  = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Separate by verification status
    const pending  = drivers.filter(d => !d.verified && d.verified !== false);
    const rejected = drivers.filter(d => d.verified === false);
    const approved = drivers.filter(d => d.verified === true);

    res.json({ drivers, pending, rejected, approved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/admin/drivers/:id/verify
 * Approve or reject a driver
 * Body: { verified: true | false }
 */
const verifyDriver = async (req, res) => {
  try {
    const { verified, rejectionReason } = req.body;
    const uid = req.params.id;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ error: 'verified must be true or false.' });
    }

    const updateData = {
      verified,
      verifiedAt:  new Date().toISOString(),
      verifiedBy:  req.user.uid,
      updatedAt:   new Date().toISOString(),
    };
    if (!verified && rejectionReason) updateData.rejectionReason = rejectionReason;

    await db.collection('users').doc(uid).update(updateData);

    res.json({
      message: verified ? 'Driver approved successfully.' : 'Driver rejected.',
      driverId: uid,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/admin/notifications
 * Broadcast a notification to platform users
 * Body: { title, message, target: 'all' | 'students' | 'drivers' }
 */
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, target = 'all' } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const validTargets = ['all', 'students', 'drivers'];
    if (!validTargets.includes(target)) {
      return res.status(400).json({ error: 'Invalid target.' });
    }

    const notification = {
      title:     title.trim(),
      message:   message.trim(),
      target,
      sentBy:    req.user.uid,
      sentAt:    new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('notifications').add(notification);

    res.json({ message: 'Notification broadcast successfully.', id: docRef.id, notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/notifications
 * List past broadcasts (most recent first)
 */
const getNotifications = async (req, res) => {
  try {
    const limit    = parseInt(req.query.limit) || 20;
    const snapshot = await db.collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/admin/notifications/:id
 * Delete a notification broadcast
 */
const deleteNotification = async (req, res) => {
  try {
    await db.collection('notifications').doc(req.params.id).delete();
    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/settings
 * Read platform settings from Firestore config/platform
 */
const getSystemSettings = async (req, res) => {
  try {
    const doc  = await db.collection('config').doc('platform').get();
    const data = doc.exists ? doc.data() : {};

    // Return defaults if not set
    res.json({
      settings: {
        maintenanceMode:    data.maintenanceMode    ?? false,
        rideBookingEnabled: data.rideBookingEnabled ?? true,
        driverAutoAccept:   data.driverAutoAccept   ?? false,
        fareMultiplier:     data.fareMultiplier     ?? 1.0,
        maxRideDistance:    data.maxRideDistance    ?? 20,
        platformMessage:    data.platformMessage    ?? '',
        ...data,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/admin/settings
 * Update platform settings
 */
const updateSystemSettings = async (req, res) => {
  try {
    const allowed = [
      'maintenanceMode', 'rideBookingEnabled', 'driverAutoAccept',
      'fareMultiplier', 'maxRideDistance', 'platformMessage',
    ];

    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    updates.updatedAt  = new Date().toISOString();
    updates.updatedBy  = req.user.uid;

    await db.collection('config').doc('platform').set(updates, { merge: true });

    res.json({ message: 'Settings updated successfully.', settings: updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/export/rides
 * Stream all rides as CSV
 */
const exportRidesCSV = async (req, res) => {
  try {
    const snapshot = await db.collection('rides').orderBy('createdAt', 'desc').get();
    const rows     = snapshot.docs.map(doc => {
      const d = doc.data();
      return [
        doc.id,
        d.studentName   || '',
        d.driverName    || '',
        d.pickupAddress || '',
        d.dropAddress   || '',
        d.status        || '',
        d.fare          ?? 0,
        d.paymentMethod || '',
        d.paymentStatus || '',
        d.distance      ? d.distance.toFixed(2) : '',
        d.createdAt     || '',
        d.completedAt   || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const header = [
      'Ride ID','Student','Driver','Pickup','Drop',
      'Status','Fare (INR)','Payment Method','Payment Status',
      'Distance (km)','Created At','Completed At',
    ].join(',');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rides_export.csv"');
    res.send([header, ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/export/users
 * Stream all users as CSV
 */
const exportUsersCSV = async (req, res) => {
  try {
    const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const rows     = snapshot.docs.map(doc => {
      const d = doc.data();
      return [
        doc.id,
        d.name          || '',
        d.email         || '',
        d.phone         || '',
        d.role          || '',
        d.vehicleNumber || '',
        d.vehicleType   || '',
        d.verified      ?? '',
        d.totalRides    ?? '',
        d.earnings      ?? '',
        d.createdAt     || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const header = [
      'User ID','Name','Email','Phone','Role',
      'Vehicle No','Vehicle Type','Verified',
      'Total Rides','Earnings (INR)','Joined At',
    ].join(',');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
    res.send([header, ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/admin/monitor
 * Live active rides: pending + accepted + ongoing
 */
const getLiveRides = async (req, res) => {
  try {
    const [pendingSnap, acceptedSnap, ongoingSnap] = await Promise.all([
      db.collection('rides').where('status', '==', 'pending').orderBy('createdAt', 'desc').get(),
      db.collection('rides').where('status', '==', 'accepted').orderBy('createdAt', 'desc').get(),
      db.collection('rides').where('status', '==', 'ongoing').orderBy('createdAt', 'desc').get(),
    ]);

    const toArr = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const rides = [
      ...toArr(ongoingSnap),
      ...toArr(acceptedSnap),
      ...toArr(pendingSnap),
    ];

    res.json({
      rides,
      counts: {
        pending:  pendingSnap.size,
        accepted: acceptedSnap.size,
        ongoing:  ongoingSnap.size,
        total:    rides.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  // Phase 1–5
  getDashboardStats,
  getAllRides,
  getAllUsers,
  changeUserRole,
  deleteUser,
  getAnalytics,
  cancelRideAdmin,
  // Phase 6
  getAdvancedAnalytics,
  getRevenueReport,
  getPendingDrivers,
  verifyDriver,
  broadcastNotification,
  getNotifications,
  deleteNotification,
  getSystemSettings,
  updateSystemSettings,
  exportRidesCSV,
  exportUsersCSV,
  getLiveRides,
};
