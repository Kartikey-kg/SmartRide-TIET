const { db, auth } = require('../config/firebase');

/**
 * POST /api/auth/register
 * After Firebase client-side signup, call this to save user profile in Firestore
 */
const registerUser = async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    const uid = req.user.uid;
    const email = req.user.email;

    // Validate role
    const allowedRoles = ['student', 'driver'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be student or driver.' });
    }

    // Check if user already registered
    const existingUser = await db.collection('users').doc(uid).get();
    if (existingUser.exists) {
      return res.status(409).json({ error: 'User already registered.' });
    }

    // Create user document in Firestore
    const userData = {
      uid,
      name:        name || '',
      email,
      phone:       phone || '',
      role,
      profilePic:  '',
      isActive:    true,
      totalRides:  0,
      rating:      0,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };

    // Add driver-specific fields
    if (role === 'driver') {
      userData.vehicleNumber = req.body.vehicleNumber || '';
      userData.vehicleType   = req.body.vehicleType || '';
      userData.isAvailable   = false;
      userData.currentLocation = null;
      userData.earnings      = 0;
    }

    await db.collection('users').doc(uid).set(userData);

    res.status(201).json({
      message: 'User registered successfully!',
      user: userData,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/auth/me
 * Returns the current logged-in user's profile from Firestore
 */
const getMe = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found. Please register first.' });
    }

    res.json({ user: userDoc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/auth/me
 * Updates the current user's profile
 */
const updateMe = async (req, res) => {
  try {
    const { name, phone, profilePic, vehicleNumber, vehicleType } = req.body;
    const uid = req.user.uid;

    const updates = {
      updatedAt: new Date().toISOString(),
    };

    if (name)         updates.name = name;
    if (phone)        updates.phone = phone;
    if (profilePic)   updates.profilePic = profilePic;
    if (vehicleNumber) updates.vehicleNumber = vehicleNumber;
    if (vehicleType)  updates.vehicleType = vehicleType;

    await db.collection('users').doc(uid).update(updates);

    res.json({ message: 'Profile updated successfully!', updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/auth/me
 * Deletes the user account from Firestore + Firebase Auth
 */
const deleteMe = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Delete from Firestore
    await db.collection('users').doc(uid).delete();

    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerUser, getMe, updateMe, deleteMe };
