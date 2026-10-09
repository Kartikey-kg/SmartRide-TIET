# ml-server/app.py
# FastAPI ML Server for SmartRideTIET
# Run with: uvicorn app:app --reload --port 8000

import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from data_loader import load_rides, get_daily_aggregates
from model import (
    demand_predictor,
    revenue_forecaster,
    cancel_predictor,
    surge_calculator,
)

# ── Cached data & trained state ────────────────────────────────
_cache = {
    "raw_df":    None,
    "daily_df":  None,
    "trained":   False,
    "avg_daily": 20.0,
}


def _init_models():
    """Load data and train (or load cached) all models on startup."""
    print("[ML] Loading data from Firebase...")
    raw_df   = load_rides(limit=500)
    daily_df = get_daily_aggregates(raw_df)

    print(f"[ML] Loaded {len(raw_df)} rides, {len(daily_df)} daily buckets")

    # Train all models
    demand_predictor.train(daily_df)
    revenue_forecaster.train(daily_df)
    cancel_predictor.train(raw_df)

    avg = float(daily_df["total_rides"].mean()) if len(daily_df) > 0 else 20.0

    _cache["raw_df"]    = raw_df
    _cache["daily_df"]  = daily_df
    _cache["trained"]   = True
    _cache["avg_daily"] = avg

    print("[ML] All ML models trained and ready!")


# ── Lifespan (runs on startup) ─────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_models()
    yield


# ── App ────────────────────────────────────────────────────────
app = FastAPI(
    title="SmartRideTIET ML Server",
    description="Machine Learning prediction API for SmartRideTIET admin dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ── Helper ─────────────────────────────────────────────────────
def _require_trained():
    if not _cache["trained"]:
        raise HTTPException(status_code=503, detail="Models not ready yet. Please retry in a moment.")


# ══════════════════════════════════════════════════════════════
# Endpoints
# ══════════════════════════════════════════════════════════════

@app.get("/health")
def health_check():
    """Health check — confirms ML server is alive."""
    return {
        "status":  "ok",
        "service": "SmartRideTIET ML Server",
        "trained": _cache["trained"],
        "rides_loaded": len(_cache["raw_df"]) if _cache["raw_df"] is not None else 0,
    }


@app.get("/predict/demand")
def predict_demand():
    """
    Predicts the number of rides for tomorrow.
    Returns: { predicted_rides: int, message: str }
    """
    _require_trained()
    predicted = demand_predictor.predict_tomorrow(_cache["daily_df"])
    return {
        "predicted_rides": predicted,
        "message": f"Estimated {predicted} rides tomorrow",
        "unit": "rides",
    }


@app.get("/predict/revenue")
def predict_revenue():
    """
    Predicts total revenue for the next 7 days.
    Returns: { predicted_revenue: float, message: str }
    """
    _require_trained()
    predicted = revenue_forecaster.predict_next_7_days(_cache["daily_df"])
    return {
        "predicted_revenue": predicted,
        "message": f"Estimated ₹{predicted:,.0f} revenue over next 7 days",
        "unit": "INR",
        "period_days": 7,
    }


@app.get("/predict/cancellation-risk")
def predict_cancellation_risk():
    """
    Returns cancellation probability for the current time slot.
    Returns: { probability: float, label: str, pct: float }
    """
    _require_trained()
    result = cancel_predictor.predict_current_risk(_cache["raw_df"])
    return result


@app.get("/predict/surge")
def predict_surge():
    """
    Returns current surge pricing multiplier based on demand.
    Returns: { multiplier: float, label: str, reason: str, is_surge: bool }
    """
    _require_trained()
    predicted_rides = demand_predictor.predict_tomorrow(_cache["daily_df"])
    result = surge_calculator.calculate(predicted_rides, _cache["avg_daily"])
    return result


@app.get("/predict/all")
def predict_all():
    """
    Returns all predictions in a single call (efficient for dashboard).
    """
    _require_trained()

    predicted_rides   = demand_predictor.predict_tomorrow(_cache["daily_df"])
    predicted_revenue = revenue_forecaster.predict_next_7_days(_cache["daily_df"])
    cancel_risk       = cancel_predictor.predict_current_risk(_cache["raw_df"])
    surge             = surge_calculator.calculate(predicted_rides, _cache["avg_daily"])

    return {
        "demand": {
            "predicted_rides": predicted_rides,
            "message": f"Estimated {predicted_rides} rides tomorrow",
        },
        "revenue": {
            "predicted_revenue": predicted_revenue,
            "message": f"Estimated ₹{predicted_revenue:,.0f} revenue over next 7 days",
        },
        "cancellation_risk": cancel_risk,
        "surge": surge,
    }


# ── Dev entrypoint ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
