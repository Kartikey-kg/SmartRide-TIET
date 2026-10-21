const { db } = require('../config/firebase');

/**
 * POST /api/rides/book
 * Student books a new ride
 */
const bookRide = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, pickupAddress, dropAddress, distance, fare, isCampusInternal, estimatedTime } = req.body;

    if (!pickupLocation || !dropLocation) {
      return res.status(400).json({ error: 'Pickup and drop locations are required.' });
    }

    const rideData = {
      studentId:           req.user.uid,
      studentName:         req.userData?.name || req.body.studentName || 'Student',
      studentPhone:        req.userData?.phone || req.body.studentPhone || '',
      studentEmail:        req.user?.email || '',
      driverId:            null,
      driverName:          null,
      driverPhone:         null,
      driverVehicleNumber: null,
      driverVehicleType:   null,
      pickupLocation,         // { lat, lng }
      dropLocation,           // { lat, lng }
      pickupAddress:       pickupAddress || '',
      dropAddress:         dropAddress || '',
      // alias fields so PaymentPage can read ride.pickup / ride.destination too
      pickup:              pickupAddress || '',
      destination:         dropAddress || '',
      distance:            distance || 0,           // in km
      fare:                fare || 0,               // in INR
      estimatedTime:       estimatedTime || '',     // e.g. "8 min"
      isCampusInternal:    isCampusInternal || false,
      status:              'pending',               // pending | accepted | ongoing | completed | cancelled
      paymentStatus:       'unpaid',               // unpaid | paid
      paymentMethod:       null,
      createdAt:           new Date().toISOString(),
      updatedAt:           new Date().toISOString(),
      acceptedAt:          null,
      completedAt:         null,
      cancelledAt:         null,
    };

    const rideRef = await db.collection('rides').add(rideData);

    res.status(201).json({
      message: 'Ride booked successfully!',
      rideId: rideRef.id,
      ride: { id: rideRef.id, ...rideData },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/rides/my
 * Get rides for the current user
 */
const getMyRides = async (req, res) => {
  try {
    const uid = req.user.uid;
    const role = req.userRole;
    let snapshot;

    if (role === 'student') {
      snapshot = await db.collection('rides')
        .where('studentId', '==', uid)
        .limit(50)
        .get();
    } else if (role === 'driver') {
      snapshot = await db.collection('rides')
        .where('driverId', '==', uid)
        .limit(50)
        .get();
    } else {
      // Admin sees all
      snapshot = await db.collection('rides')
        .limit(50)
        .get();
    }

    const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    rides.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/rides/:id
 * Get a specific ride by ID
 */
const getRideById = async (req, res) => {
  try {
    const rideDoc = await db.collection('rides').doc(req.params.id).get();

    if (!rideDoc.exists) {
      return res.status(404).json({ error: 'Ride not found.' });
    }

    res.json({ ride: { id: rideDoc.id, ...rideDoc.data() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/rides/:id/accept
 * Driver accepts a pending ride
 */
const acceptRide = async (req, res) => {
  try {
    const rideRef = db.collection('rides').doc(req.params.id);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) return res.status(404).json({ error: 'Ride not found.' });

    const rideData = rideDoc.data();

    // If already accepted by this driver, return success so frontend moves to current ride!
    if (rideData.driverId === req.user.uid && ['accepted', 'ongoing'].includes(rideData.status)) {
      return res.json({ message: 'Ride already accepted by you!', rideId: req.params.id });
    }

    if (rideData.status !== 'pending') {
      return res.status(400).json({ error: 'Ride is no longer available (already accepted or cancelled).' });
    }

    const driverData = req.userData || {};

    await rideRef.update({
      driverId:            req.user.uid,
      driverName:          driverData.name || 'Driver',
      driverPhone:         driverData.phone || '',
      driverVehicleNumber: driverData.vehicleNumber || 'Standard',
      driverVehicleType:   driverData.vehicleType || 'Cab / Auto',
      status:              'accepted',
      acceptedAt:          new Date().toISOString(),
      updatedAt:           new Date().toISOString(),
    });

    res.json({ message: 'Ride accepted!', rideId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/rides/:id/complete
 * Driver marks ride as completed
 */
const completeRide = async (req, res) => {
  try {
    const rideRef = db.collection('rides').doc(req.params.id);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) return res.status(404).json({ error: 'Ride not found.' });

    await rideRef.update({
      status:      'completed',
      completedAt: new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    });

    // Update driver earnings + total rides
    const fare = rideDoc.data().fare || 0;
    const driverId = rideDoc.data().driverId;
    if (driverId) {
      const { FieldValue } = require('firebase-admin/firestore');
      await db.collection('users').doc(driverId).update({
        earnings:   FieldValue.increment(fare),
        totalRides: FieldValue.increment(1),
      });
    }

    res.json({ message: 'Ride completed!', rideId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/rides/:id/cancel
 * Cancel a ride (by student or driver)
 */
const cancelRide = async (req, res) => {
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
    });

    res.json({ message: 'Ride cancelled.', rideId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/rides/driver/available
 * Driver sees all pending rides they can accept
 */
const getAvailableRides = async (req, res) => {
  try {
    const snapshot = await db.collection('rides')
      .where('status', '==', 'pending')
      .limit(50)
      .get();

    const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    rides.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/rides/:id/confirm-payment
 * Confirm cash or offline payment for a ride (by driver, student, or admin)
 */
const confirmPayment = async (req, res) => {
  try {
    const rideRef = db.collection('rides').doc(req.params.id);
    const rideDoc = await rideRef.get();

    if (!rideDoc.exists) return res.status(404).json({ error: 'Ride not found.' });

    const ride = rideDoc.data();
    const uid = req.user.uid;
    const isDriver = ride.driverId === uid;
    const isStudent = ride.studentId === uid;
    const isAdmin = req.userRole === 'admin';

    if (!isDriver && !isStudent && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update payment for this ride.' });
    }

    const { paymentMethod = 'cash' } = req.body;

    await rideRef.update({
      paymentStatus: 'paid',
      paymentMethod,
      paidAt:        new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
    });

    res.json({
      message: 'Payment confirmed successfully!',
      rideId: req.params.id,
      paymentStatus: 'paid',
      paymentMethod,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  bookRide,
  getMyRides,
  getRideById,
  acceptRide,
  completeRide,
  cancelRide,
  getAvailableRides,
  confirmPayment,
};
