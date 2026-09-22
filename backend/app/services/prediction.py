"""
TrafficSense AI — Prediction service.

Uses a trained XGBoost model (when available) or heuristic fallback to
predict traffic conditions at 15 / 30 / 60 minute horizons.
"""

import os
import random
from datetime import datetime, timezone, timedelta
from typing import List, Tuple

import numpy as np
import pandas as pd

from app.core.config import settings
from app.models.schemas import TrafficPrediction, CongestionLevel
from app.services.traffic import (
    BANGALORE_SEGMENTS,
    calculate_congestion,
    get_congestion_level,
    _time_factor,
)

_MODEL = None
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "artifacts", "xgb_speed_model.pkl"
)


def _load_model():
    global _MODEL
    if _MODEL is None and os.path.exists(_MODEL_PATH):
        import joblib
        _MODEL = joblib.load(_MODEL_PATH)
    return _MODEL


class PredictionService:
    """Traffic prediction using XGBoost or heuristic fallback."""

    def get_predictions(
        self,
        segment_id: str | None = None,
        horizon: int = 15,
    ) -> Tuple[List[dict], str]:
        """
        Return predictions for all segments (or a specific one).

        Parameters
        ----------
        segment_id : filter to a single segment
        horizon    : 15, 30, or 60 minutes
        """
        if horizon not in (15, 30, 60):
            horizon = 15

        model = _load_model()
        segments = BANGALORE_SEGMENTS
        if segment_id:
            segments = [s for s in segments if s["id"] == segment_id] or segments[:1]

        predictions: List[TrafficPrediction] = []

        for seg in segments:
            now = datetime.now(tz=timezone.utc)
            future_hour = (now + timedelta(minutes=horizon)).hour
            future_hour_ist = (future_hour + 5) % 24
            dow = (now + timedelta(minutes=horizon)).weekday()

            if model is not None:
                pred = self._ml_predict(model, seg, future_hour_ist, dow, horizon)
                mode = "ml_prediction"
            else:
                pred = self._heuristic_predict(seg, future_hour_ist, dow, horizon)
                mode = "heuristic"

            predictions.append(pred)

        return [p.model_dump(mode="json") for p in predictions], mode

    def _ml_predict(
        self, model, seg: dict, hour: int, dow: int, horizon: int
    ) -> TrafficPrediction:
        ffs = seg["ffs"]
        lag_speed = ffs * (1 - _time_factor(hour) * random.uniform(0.6, 1.0))
        lag_congestion = max(0, min(1, 1 - lag_speed / ffs))
        seg_idx = int(seg["id"].split("-")[1]) - 1  # seg-001 -> 0
        features = pd.DataFrame([{
            "hour": hour,
            "day_of_week": dow,
            "is_weekend": int(dow >= 5),
            "segment_idx": seg_idx,
            "free_flow_speed": ffs,
            "lag_speed_1h": lag_speed,
            "lag_congestion_1h": lag_congestion,
            "temperature": random.uniform(22, 32),
            "is_rainy": random.choice([0, 0, 0, 1]),
        }])
        pred_speed = float(model.predict(features)[0])
        pred_speed = max(2.0, min(ffs, pred_speed))
        congestion = calculate_congestion(pred_speed, ffs)
        level = get_congestion_level(congestion)

        # Degrade confidence for longer horizons
        base_conf = 0.90
        conf = base_conf - (horizon - 15) * 0.005
        conf += random.uniform(-0.03, 0.03)
        conf = max(0.60, min(0.99, conf))

        # Current values for comparison
        now_hour_ist = (datetime.now(tz=timezone.utc).hour + 5) % 24
        curr_factor = _time_factor(now_hour_ist)
        curr_speed = ffs * (1 - curr_factor * random.uniform(0.6, 1.0))

        return TrafficPrediction(
            segment_id=seg["id"],
            road_name=seg["road_name"],
            horizon_minutes=horizon,
            predicted_speed=round(pred_speed, 1),
            predicted_congestion=round(congestion, 3),
            predicted_level=level,
            confidence=round(conf, 2),
            current_speed=round(max(2.0, curr_speed), 1),
            current_congestion=round(calculate_congestion(curr_speed, ffs), 3),
        )

    def _heuristic_predict(
        self, seg: dict, hour: int, dow: int, horizon: int
    ) -> TrafficPrediction:
        """Simple heuristic when no ML model is available."""
        ffs = seg["ffs"]
        factor = _time_factor(hour)
        pred_speed = ffs * (1 - factor * random.uniform(0.6, 1.0))
        pred_speed = max(2.0, round(pred_speed, 1))
        congestion = calculate_congestion(pred_speed, ffs)
        level = get_congestion_level(congestion)

        conf = 0.75 - (horizon - 15) * 0.008 + random.uniform(-0.05, 0.05)
        conf = max(0.50, min(0.95, conf))

        now_hour_ist = (datetime.now(tz=timezone.utc).hour + 5) % 24
        curr_factor = _time_factor(now_hour_ist)
        curr_speed = ffs * (1 - curr_factor * random.uniform(0.6, 1.0))

        return TrafficPrediction(
            segment_id=seg["id"],
            road_name=seg["road_name"],
            horizon_minutes=horizon,
            predicted_speed=pred_speed,
            predicted_congestion=round(congestion, 3),
            predicted_level=level,
            confidence=round(conf, 2),
            current_speed=round(max(2.0, curr_speed), 1),
            current_congestion=round(calculate_congestion(curr_speed, ffs), 3),
        )
