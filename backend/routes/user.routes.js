const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// GET  /api/users/drivers  → List all active drivers (student can see)
router.get('/drivers', verifyToken, userController.getAllDrivers);

// GET  /api/users/:id      → Get a specific user's public profile
router.get('/:id', verifyToken, userController.getUserById);

module.exports = router;
