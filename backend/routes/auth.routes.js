const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

// POST /api/auth/register  → Create user profile in Firestore after Firebase signup
router.post('/register', verifyToken, authController.registerUser);

// GET /api/auth/me         → Get current logged-in user profile
router.get('/me', verifyToken, authController.getMe);

// PUT /api/auth/me         → Update current user profile
router.put('/me', verifyToken, authController.updateMe);

// DELETE /api/auth/me      → Delete account
router.delete('/me', verifyToken, authController.deleteMe);

module.exports = router;
