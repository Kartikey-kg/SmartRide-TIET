// backend/routes/ml.routes.js
// Proxy layer: forwards ML prediction requests from the frontend
// to the Python FastAPI ML server. Keeps ML server private.

const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

// ── Protect all ML routes (admin only) ───────────────────────
router.use(verifyToken, requireRole('admin'));

// ── ML Server URL from env ────────────────────────────────────
const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

// ── Generic proxy helper ──────────────────────────────────────
async function proxyToML(mlPath, res) {
  try {
    const response = await fetch(`${ML_SERVER_URL}${mlPath}`);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'ML Server error',
        detail: errorText,
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    // ML server is offline — return graceful fallback
    console.warn(`⚠️  ML Server unreachable at ${ML_SERVER_URL}${mlPath}:`, err.message);
    return res.status(503).json({
      error: 'ML Server offline',
      message: 'Python ML server is not running. Start it with: python app.py in /ml-server',
      offline: true,
    });
  }
}

// ── Routes ────────────────────────────────────────────────────

// GET /api/ml/health — Check if ML server is alive
router.get('/health', async (req, res) => {
  await proxyToML('/health', res);
});

// GET /api/ml/demand — Predicted rides for tomorrow
router.get('/demand', async (req, res) => {
  await proxyToML('/predict/demand', res);
});

// GET /api/ml/revenue — Predicted revenue for next 7 days
router.get('/revenue', async (req, res) => {
  await proxyToML('/predict/revenue', res);
});

// GET /api/ml/cancellation-risk — Current cancellation risk
router.get('/cancellation-risk', async (req, res) => {
  await proxyToML('/predict/cancellation-risk', res);
});

// GET /api/ml/surge — Current surge multiplier
router.get('/surge', async (req, res) => {
  await proxyToML('/predict/surge', res);
});

// GET /api/ml/all — All predictions in one call (used by AdminAnalytics)
router.get('/all', async (req, res) => {
  await proxyToML('/predict/all', res);
});

module.exports = router;
