const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const rideController = require('../controllers/ride.controller');

// POST /api/rides/book    → Student books a new ride
router.post('/book', verifyToken, requireRole('student'), rideController.bookRide);

// GET  /api/rides/my      → Get rides for the current user (student or driver)
router.get('/my', verifyToken, rideController.getMyRides);

// GET  /api/rides/:id     → Get a specific ride by ID
router.get('/:id', verifyToken, rideController.getRideById);

// PUT  /api/rides/:id/accept  → Driver accepts a ride
router.put('/:id/accept', verifyToken, requireRole('driver'), rideController.acceptRide);

// PUT  /api/rides/:id/complete → Driver marks ride as completed
router.put('/:id/complete', verifyToken, requireRole('driver'), rideController.completeRide);

// PUT  /api/rides/:id/cancel  → Student or driver cancels a ride
router.put('/:id/cancel', verifyToken, rideController.cancelRide);

// GET  /api/rides/available   → Driver sees available/pending rides nearby
router.get('/driver/available', verifyToken, requireRole('driver'), rideController.getAvailableRides);

module.exports = router;
