const { db } = require('../config/firebase');

/**
 * GET /api/users/drivers
 * Returns all active drivers
 */
const getAllDrivers = async (req, res) => {
  try {
    const snapshot = await db.collection('users')
      .where('role', '==', 'driver')
      .where('isActive', '==', true)
      .get();

    const drivers = snapshot.docs.map(doc => {
      const data = doc.data();
      // Return only public info — no sensitive fields
      return {
        uid:             data.uid,
        name:            data.name,
        profilePic:      data.profilePic,
        vehicleNumber:   data.vehicleNumber,
        vehicleType:     data.vehicleType,
        rating:          data.rating,
        totalRides:      data.totalRides,
        isAvailable:     data.isAvailable,
        currentLocation: data.currentLocation,
      };
    });

    res.json({ drivers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/users/:id
 * Returns a specific user's public profile
 */
const getUserById = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const data = userDoc.data();
    // Strip sensitive fields
    const { phone, email, earnings, ...publicData } = data;

    res.json({ user: publicData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllDrivers, getUserById };
