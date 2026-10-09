# ml-server/model.py
# ML model classes: Demand, Revenue, Cancellation, Surge

import os
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timedelta, timezone
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.pipeline import Pipeline

MODELS_DIR = os.getenv("MODELS_DIR", "./models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ══════════════════════════════════════════════════════════════
# 1. Demand Predictor
#    Predicts how many rides will happen tomorrow
# ══════════════════════════════════════════════════════════════
class DemandPredictor:
    MODEL_PATH = os.path.join(MODELS_DIR, "demand_model.pkl")

    def __init__(self):
        self.model = None

    def train(self, daily_df: pd.DataFrame):
        """
        Train on daily aggregated data.
        Features: day_of_week, is_weekend, lag_1 (yesterday's rides)
        Target: total_rides
        """
        df = daily_df.copy().sort_values("date").reset_index(drop=True)
        df["day_of_week"] = pd.to_datetime(df["date"]).dt.weekday
        df["is_weekend"]  = (df["day_of_week"] >= 5).astype(int)
        df["lag_1"]       = df["total_rides"].shift(1).fillna(df["total_rides"].mean())

        X = df[["day_of_week", "is_weekend", "lag_1"]].values
        y = df["total_rides"].values

        self.model = Pipeline([
            ("scaler", StandardScaler()),
            ("reg",    LinearRegression()),
        ])
        self.model.fit(X, y)
        joblib.dump(self.model, self.MODEL_PATH)

    def predict_tomorrow(self, daily_df: pd.DataFrame) -> int:
        """Returns predicted ride count for tomorrow."""
        if self.model is None:
            self._load_or_train(daily_df)

        tomorrow     = datetime.now(tz=timezone.utc) + timedelta(days=1)
        dow          = tomorrow.weekday()
        is_weekend   = int(dow >= 5)
        last_rides   = daily_df["total_rides"].iloc[-1] if len(daily_df) > 0 else 20
        X            = np.array([[dow, is_weekend, last_rides]])
        prediction   = self.model.predict(X)[0]
        return max(1, int(round(prediction)))

    def _load_or_train(self, daily_df: pd.DataFrame):
        if os.path.exists(self.MODEL_PATH):
            self.model = joblib.load(self.MODEL_PATH)
        else:
            self.train(daily_df)


# ══════════════════════════════════════════════════════════════
# 2. Revenue Forecaster
#    Predicts total revenue for the next 7 days
# ══════════════════════════════════════════════════════════════
class RevenueForecaster:
    MODEL_PATH = os.path.join(MODELS_DIR, "revenue_model.pkl")

    def __init__(self):
        self.model      = None
        self.avg_daily  = 0.0

    def train(self, daily_df: pd.DataFrame):
        df = daily_df.copy().sort_values("date").reset_index(drop=True)
        df["day_of_week"] = pd.to_datetime(df["date"]).dt.weekday
        df["is_weekend"]  = (df["day_of_week"] >= 5).astype(int)
        df["day_index"]   = range(len(df))

        X = df[["day_index", "day_of_week", "is_weekend"]].values
        y = df["revenue"].values

        self.model     = Pipeline([
            ("poly",   PolynomialFeatures(degree=2, include_bias=False)),
            ("scaler", StandardScaler()),
            ("reg",    LinearRegression()),
        ])
        self.model.fit(X, y)
        self.avg_daily = float(y.mean())
        joblib.dump({"model": self.model, "avg_daily": self.avg_daily}, self.MODEL_PATH)

    def predict_next_7_days(self, daily_df: pd.DataFrame) -> float:
        """Returns predicted total revenue for the next 7 days."""
        if self.model is None:
            self._load_or_train(daily_df)

        base_index = len(daily_df)
        total = 0.0
        for i in range(7):
            future_day = datetime.now(tz=timezone.utc) + timedelta(days=i + 1)
            dow        = future_day.weekday()
            is_weekend = int(dow >= 5)
            X          = np.array([[base_index + i, dow, is_weekend]])
            pred       = self.model.predict(X)[0]
            total      += max(0.0, pred)

        return round(total, 2)

    def _load_or_train(self, daily_df: pd.DataFrame):
        if os.path.exists(self.MODEL_PATH):
            saved        = joblib.load(self.MODEL_PATH)
            self.model   = saved["model"]
            self.avg_daily = saved["avg_daily"]
        else:
            self.train(daily_df)


# ══════════════════════════════════════════════════════════════
# 3. Cancellation Risk Predictor
#    Returns probability (0–100%) that a generic ride will be cancelled
# ══════════════════════════════════════════════════════════════
class CancellationPredictor:
    MODEL_PATH = os.path.join(MODELS_DIR, "cancel_model.pkl")

    def __init__(self):
        self.model = None

    def train(self, raw_df: pd.DataFrame):
        """
        Features: hour, day_of_week, is_weekend
        Target: 1 = cancelled, 0 = not cancelled
        """
        df = raw_df.copy()
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
        df["cancelled"]  = (df["status"] == "cancelled").astype(int)

        X = df[["hour", "day_of_week", "is_weekend"]].values
        y = df["cancelled"].values

        # Ensure both classes present for Logistic Regression
        if len(set(y)) < 2:
            # If only one class, add a synthetic opposite sample
            X = np.vstack([X, [12, 2, 0]])
            y = np.append(y, 1 - y[0])

        self.model = Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    LogisticRegression(max_iter=500)),
        ])
        self.model.fit(X, y)
        joblib.dump(self.model, self.MODEL_PATH)

    def predict_current_risk(self, raw_df: pd.DataFrame) -> dict:
        """
        Returns cancellation risk for the current hour.
        {"probability": 0.34, "label": "Medium (34%)"}
        """
        if self.model is None:
            self._load_or_train(raw_df)

        now        = datetime.now(tz=timezone.utc)
        hour       = now.hour
        dow        = now.weekday()
        is_weekend = int(dow >= 5)
        X          = np.array([[hour, dow, is_weekend]])

        prob = float(self.model.predict_proba(X)[0][1])
        pct  = round(prob * 100, 1)

        if pct < 30:
            label = f"Low ({pct}%)"
        elif pct < 60:
            label = f"Medium ({pct}%)"
        else:
            label = f"High ({pct}%)"

        return {"probability": prob, "label": label, "pct": pct}

    def _load_or_train(self, raw_df: pd.DataFrame):
        if os.path.exists(self.MODEL_PATH):
            self.model = joblib.load(self.MODEL_PATH)
        else:
            self.train(raw_df)


# ══════════════════════════════════════════════════════════════
# 4. Surge Calculator
#    Rule-based surge multiplier seeded with demand prediction
# ══════════════════════════════════════════════════════════════
class SurgeCalculator:

    @staticmethod
    def calculate(predicted_rides: int, avg_daily_rides: float) -> dict:
        """
        Returns surge multiplier based on demand vs average.
        {"multiplier": 1.3, "label": "1.3×", "reason": "High demand period"}
        """
        now   = datetime.now(tz=timezone.utc)
        hour  = now.hour
        dow   = now.weekday()

        # Peak-hour bonus
        is_peak_hour    = hour in [8, 9, 17, 18, 19, 20]
        is_peak_day     = dow < 5   # weekday
        demand_ratio    = predicted_rides / max(avg_daily_rides, 1)

        multiplier = 1.0

        if demand_ratio > 1.5:
            multiplier += 0.4
        elif demand_ratio > 1.2:
            multiplier += 0.2

        if is_peak_hour:
            multiplier += 0.2

        if is_peak_day and is_peak_hour:
            multiplier += 0.1

        multiplier = round(min(multiplier, 2.5), 1)  # cap at 2.5×

        if multiplier >= 2.0:
            reason = "Extreme demand — very busy period"
        elif multiplier >= 1.5:
            reason = "High demand — peak hours"
        elif multiplier >= 1.2:
            reason = "Moderate demand"
        else:
            reason = "Normal — no surge"

        return {
            "multiplier": multiplier,
            "label": f"{multiplier}×",
            "reason": reason,
            "is_surge": multiplier > 1.0,
        }


# ══════════════════════════════════════════════════════════════
# Model Registry — single shared instances
# ══════════════════════════════════════════════════════════════
demand_predictor    = DemandPredictor()
revenue_forecaster  = RevenueForecaster()
cancel_predictor    = CancellationPredictor()
surge_calculator    = SurgeCalculator()
