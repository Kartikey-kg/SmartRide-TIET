# ml-server/data_loader.py
# Reads ride data from Firebase Firestore and returns pandas DataFrames

import os
import json
import pandas as pd
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# ── Firebase init (lazy, only once) ───────────────────────────
_db = None

def _get_db():
    global _db
    if _db is not None:
        return _db

    import firebase_admin
    from firebase_admin import credentials, firestore

    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")

        if cred_path and os.path.exists(cred_path):
            # Option A: use serviceAccountKey.json file
            cred = credentials.Certificate(cred_path)
        else:
            # Option B: build cred from env vars
            private_key = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id":   os.getenv("FIREBASE_PROJECT_ID"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "private_key":  private_key,
                "token_uri":    "https://oauth2.googleapis.com/token",
            })

        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db


# ── Load rides from Firestore ──────────────────────────────────
def load_rides(limit: int = 500) -> pd.DataFrame:
    """
    Fetches the latest `limit` rides from Firestore.
    Returns a DataFrame with columns:
      date, hour, day_of_week, status, fare, duration_minutes
    """
    db = _get_db()
    docs = db.collection("rides").order_by("createdAt", direction="DESCENDING").limit(limit).stream()

    rows = []
    for doc in docs:
        d = doc.to_dict()
        created_at = d.get("createdAt")

        # Firestore Timestamp → Python datetime
        if hasattr(created_at, "to_datetime"):
            dt = created_at.to_datetime()
        elif isinstance(created_at, datetime):
            dt = created_at
        else:
            continue  # skip malformed docs

        # Ensure timezone-aware
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        rows.append({
            "date":             dt.date(),
            "hour":             dt.hour,
            "day_of_week":      dt.weekday(),   # 0=Mon … 6=Sun
            "status":           d.get("status", "unknown"),
            "fare":             float(d.get("fare", 0) or 0),
            "duration_minutes": float(d.get("durationMinutes", 10) or 10),
        })

    if not rows:
        return _generate_synthetic_data()

    return pd.DataFrame(rows)


# ── Synthetic fallback (when Firestore has <10 rides) ─────────
def _generate_synthetic_data() -> pd.DataFrame:
    """
    Generates 90 days of realistic synthetic ride data for model training
    when real Firebase data is insufficient.
    """
    import numpy as np
    from datetime import date, timedelta

    np.random.seed(42)
    rows = []
    base = date.today()

    for day_offset in range(90):
        day = base - timedelta(days=day_offset)
        dow = day.weekday()
        # More rides on weekdays, peak hours 8-9 and 17-19
        n_rides = int(np.random.normal(30 if dow < 5 else 15, 5))
        n_rides = max(5, n_rides)

        for _ in range(n_rides):
            hour = int(np.random.choice(
                [8, 9, 17, 18, 19, 12, 13, 20, 21],
                p=[0.15, 0.12, 0.15, 0.12, 0.08, 0.1, 0.08, 0.1, 0.1]
            ))
            status = np.random.choice(
                ["completed", "cancelled", "completed"],
                p=[0.7, 0.2, 0.1]
            )
            fare = round(float(np.random.uniform(30, 120)), 2) if status == "completed" else 0.0

            rows.append({
                "date":             day,
                "hour":             hour,
                "day_of_week":      dow,
                "status":           status,
                "fare":             fare,
                "duration_minutes": round(float(np.random.uniform(5, 25)), 1),
            })

    return pd.DataFrame(rows)


# ── Aggregated daily summary ───────────────────────────────────
def get_daily_aggregates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Groups raw ride data into daily totals:
      date, total_rides, completed, cancelled, revenue
    """
    df["date"] = pd.to_datetime(df["date"])
    agg = df.groupby("date").agg(
        total_rides=("status", "count"),
        completed=("status", lambda x: (x == "completed").sum()),
        cancelled=("status", lambda x: (x == "cancelled").sum()),
        revenue=("fare", "sum"),
    ).reset_index().sort_values("date")
    return agg
