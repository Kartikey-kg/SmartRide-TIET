# <img src="frontend/src/assets/tiet_logo_icon.png" alt="TIET Logo" height="36" valign="middle" /> SmartRideTIET

> Campus ride-sharing platform for Thapar Institute of Engineering & Technology (TIET) students — powered by Firebase, Node.js, React, and a Python ML engine.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js (Vite) |
| Backend | Node.js + Express.js |
| ML Server | Python + FastAPI + scikit-learn |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Maps | Google Maps API |
| Payments | Razorpay |
| Hosting | Firebase Hosting |

---

## 🚀 Quick Start

Open **3 terminals** in VS Code (`Ctrl + Shift + 5`):

### Terminal 1 — Node.js Backend
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Terminal 2 — React Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Terminal 3 — Python ML Server
```bash
cd ml-server

# First time only — install dependencies
python -m pip install -r requirements.txt

# Start the server
python app.py
# Runs on http://localhost:8000
```

> **Note:** The ML server is optional. If it's not running, the Admin Analytics page shows a friendly offline banner instead of crashing.

---

## ⚙️ Environment Variables

### Backend — `backend/.env`
```env
PORT=5000
NODE_ENV=development
ML_SERVER_URL=http://localhost:8000

FRONTEND_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"

RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Frontend — `frontend/.env`
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### ML Server — `ml-server/.env`
```env
PORT=8000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"
```

---

## 📦 Project Phases

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Project Setup + Firebase Config | ✅ Done |
| Phase 2 | Authentication (Login/Register) | ✅ Done |
| Phase 3 | Ride Booking System | ✅ Done |
| Phase 4 | Live GPS Tracking + Campus Landmarks | ✅ Done |
| Phase 5 | Razorpay Payments + Wallet | ✅ Done |
| Phase 6 | Admin Dashboard + Advanced Analytics | ✅ Done |
| Phase 7 | Python ML Predictions Engine | ✅ Done |

---

## 📁 Project Structure

```
SmartRideTIET/
├── frontend/              ← React + Vite
│   ├── src/
│   │   ├── pages/         ← Student, Driver, Admin pages
│   │   │   └── admin/
│   │   │       └── AdminAnalytics.jsx  ← ML predictions UI
│   │   ├── components/    ← Reusable UI components
│   │   ├── services/
│   │   │   └── api.js     ← All API calls (incl. getMLPredictions)
│   │   ├── context/       ← Global state (Auth)
│   │   └── App.jsx        ← Root with all routes
│   └── .env               ← Firebase client keys
│
├── backend/               ← Node.js + Express
│   ├── routes/
│   │   ├── ml.routes.js   ← NEW: proxies requests to Python ML server
│   │   └── ...            ← auth, rides, admin, payment routes
│   ├── controllers/       ← Business logic
│   ├── middleware/        ← Auth + Role checks
│   ├── config/            ← Firebase Admin SDK
│   └── server.js          ← Entry point
│
├── ml-server/             ← NEW: Python FastAPI ML Server
│   ├── app.py             ← FastAPI server (main entry point)
│   ├── model.py           ← ML models (Demand, Revenue, Cancellation, Surge)
│   ├── data_loader.py     ← Reads ride data from Firebase Firestore
│   ├── requirements.txt   ← Python dependencies
│   ├── .env               ← ML server config
│   └── models/            ← Saved .pkl model files (auto-generated)
│
└── firebase/              ← Firestore rules & hosting
```

---

## 🤖 ML Predictions (Phase 7)

The Python ML server trains on your real Firebase ride data and exposes 4 predictions on the Admin Analytics dashboard:

| Prediction | Algorithm | What It Shows |
|------------|-----------|---------------|
| 🔮 Rides Tomorrow | Linear Regression | Estimated ride count for tomorrow |
| 💰 Revenue (7 days) | Polynomial Regression | Predicted revenue for next week |
| ⚠️ Cancellation Risk | Logistic Regression | Current hour cancellation probability |
| ⚡ Surge Multiplier | Rule-based + ML | Live fare surge (1.0× – 2.5×) |

### How It Works

```
Firebase Firestore
      ↓  (firebase-admin SDK)
Python ML Server  →  trains models on startup
      ↑  (HTTP proxy via /api/ml/*)
Node.js Backend
      ↑  (Axios + Firebase ID Token)
React Frontend → Admin Analytics page
```

### ML API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | ML server health check |
| `GET /predict/demand` | Rides predicted for tomorrow |
| `GET /predict/revenue` | Revenue forecast for next 7 days |
| `GET /predict/cancellation-risk` | Current cancellation risk |
| `GET /predict/surge` | Current surge multiplier |
| `GET /predict/all` | All predictions in one call |

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project → Enable **Firestore** and **Authentication**
3. Go to **Project Settings → Service Accounts** → Generate Private Key → save as `backend/config/serviceAccountKey.json`
4. Go to **Project Settings → Your Apps** → Add Web App → Copy config to `frontend/.env`

---

*Built with ❤️ for TIET campus community*
