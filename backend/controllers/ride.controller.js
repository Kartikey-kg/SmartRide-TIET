const { db } = require('../config/firebase');

/**
 * POST /api/rides/book
 * Student books a new ride
 */
const bookRide = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, pickupAddress, dropAddress, distance, fare, isCampusInternal } = req.body;

    if (!pickupLocation || !dropLocation) {
      return res.status(400).json({ error: 'Pickup and drop locations are required.' });
    }

    const rideData = {
      studentId:        req.user.uid,
      studentName:      req.userData?.name || '',
      driverId:         null,
      driverName:       null,
      pickupLocation,         // { lat, lng }
      dropLocation,           // { lat, lng }
      pickupAddress:    pickupAddress || '',
      dropAddress:      dropAddress || '',
      // alias fields so PaymentPage can read ride.pickup / ride.destination too
      pickup:           pickupAddress || '',
      destination:      dropAddress || '',
      distance:         distance || 0,           // in km
      fare:             fare || 0,               // in INR
      isCampusInternal: isCampusInternal || false, // ✅ fixed: was never saved
      status:           'pending',               // pending | accepted | ongoing | completed | cancelled
      paymentStatus:    'unpaid',               // unpaid | paid
      paymentMethod:    null,
      createdAt:        new Date().toISOString(),
      updatedAt:        new Date().toISOString(),
      acceptedAt:       null,
      completedAt:      null,
      cancelledAt:      null,
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
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
    } else if (role === 'driver') {
      snapshot = await db.collection('rides')
        .where('driverId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
    } else {
      // Admin sees all
      snapshot = await db.collection('rides')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
    }

    const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    if (rideDoc.data().status !== 'pending') {
      return res.status(400).json({ error: 'Ride is not in pending state.' });
    }

    await rideRef.update({
      driverId:   req.user.uid,
      driverName: req.userData?.name || '',
      status:     'accepted',
      acceptedAt: new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
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
      .orderBy('createdAt', 'asc')
      .limit(20)
      .get();

    const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { bookRide, getMyRides, getRideById, acceptRide, completeRide, cancelRide, getAvailableRides };
