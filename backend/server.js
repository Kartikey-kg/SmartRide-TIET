const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
require('./config/firebase');

// Import Routes
const authRoutes    = require('./routes/auth.routes');
const rideRoutes    = require('./routes/ride.routes');
const userRoutes    = require('./routes/user.routes');
const adminRoutes   = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const mlRoutes      = require('./routes/ml.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/rides',    rideRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ml',       mlRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🚌 SmartRideTIET API is running!',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ SmartRideTIET Backend running on http://localhost:${PORT}`);
});
