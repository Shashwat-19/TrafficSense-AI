"""
TrafficSense AI — Prediction service.

Uses a trained XGBoost model (when available) or heuristic fallback to
predict traffic conditions at 15 / 30 / 60 minute horizons.
"""

import logging
import os
import random
from datetime import datetime, timezone, timedelta
from typing import List, Tuple

import pandas as pd

from app.models.schemas import TrafficPrediction
from app.services.traffic import (
    BANGALORE_SEGMENTS,
    TrafficService,
    calculate_congestion,
    get_congestion_level,
)

logger = logging.getLogger(__name__)

_MODEL = None  # None: not tried yet, False: load failed (heuristic only)
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "artifacts", "xgb_speed_model.pkl"
)
_traffic_service = TrafficService()


def _load_model():
    global _MODEL
    if _MODEL is None:
        _MODEL = False
        if os.path.exists(_MODEL_PATH):
            try:
                import joblib
                # Trust assumption: joblib (pickle) runs code on load, so the model
                # file must only come from our own train_model.py run, never from
                # user input or another untrusted source. Format is kept as joblib.
                loaded = joblib.load(_MODEL_PATH)
                if hasattr(loaded, "predict"):
                    _MODEL = loaded
                else:
                    logger.warning("Model file %s has no predict(); using heuristic", _MODEL_PATH)
            except Exception:
                logger.exception("Failed to load model %s; using heuristic", _MODEL_PATH)
    return _MODEL if _MODEL is not False else None


def _expected_time_factor(hour: int) -> float:
    """Mean of traffic._time_factor for an hour (its random jitter averaged out)."""
    if 8 <= hour <= 10:
        return 0.925
    if 17 <= hour <= 20:
        return 0.90
    if 12 <= hour <= 14:
        return 0.525
    if 22 <= hour or hour <= 5:
        return 0.10
    return 0.40


def _modelled_speed(ffs: float, hour: int, dow: int) -> float:
    """Deterministic expected speed, mirroring the training data's weekend effect."""
    factor = _expected_time_factor(hour) * (0.6 if dow >= 5 else 1.0)
    return max(2.0, ffs * (1 - factor))


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
        segment_id : filter to a single segment; unknown IDs raise ValueError
        horizon    : 15, 30, or 60 minutes
        """
        if horizon not in (15, 30, 60):
            horizon = 15

        segments = BANGALORE_SEGMENTS
        if segment_id:
            segments = [s for s in BANGALORE_SEGMENTS if s["id"] == segment_id]
            if not segments:
                raise ValueError(f"Unknown segment_id: {segment_id}")

        model = _load_model()

        # Same source as /traffic/current, so current_speed agrees with it.
        traffic, traffic_mode = _traffic_service.get_current_traffic()
        live_speeds = {t["id"]: t["current_speed"] for t in traffic}
        use_live_lag = traffic_mode == "live"

        now = datetime.now(tz=timezone.utc) + timedelta(hours=5)  # IST, approx UTC+5
        target = now + timedelta(minutes=horizon)
        target_hour, target_dow = target.hour, target.weekday()
        # Previous hour of the target, the lag the model was trained with.
        prev = target - timedelta(hours=1)
        prev_hour, prev_dow = prev.hour, prev.weekday()

        predictions: List[TrafficPrediction] = []

        for seg in segments:
            ffs = seg["ffs"]
            current_speed = live_speeds.get(seg["id"])
            if current_speed is None:
                current_speed = _modelled_speed(ffs, now.hour, now.weekday())

            if use_live_lag:
                lag_speed = current_speed
            else:
                lag_speed = _modelled_speed(ffs, prev_hour, prev_dow)

            if model is not None:
                pred = self._ml_predict(
                    model, seg, target_hour, target_dow, horizon, lag_speed, current_speed
                )
                mode = "ml_prediction"
            else:
                pred = self._heuristic_predict(seg, target_hour, target_dow, horizon, current_speed)
                mode = "heuristic"

            predictions.append(pred)

        return [p.model_dump(mode="json") for p in predictions], mode

    def _ml_predict(
        self, model, seg: dict, hour: int, dow: int, horizon: int,
        lag_speed: float, current_speed: float,
    ) -> TrafficPrediction:
        ffs = seg["ffs"]
        lag_speed = max(2.0, min(ffs, lag_speed))  # same clip as training
        lag_congestion = max(0.0, min(1.0, 1 - lag_speed / ffs))
        seg_idx = int(seg["id"].split("-")[1]) - 1  # seg-001 -> 0
        features = pd.DataFrame([{
            "hour": hour,
            "day_of_week": dow,
            "is_weekend": int(dow >= 5),
            "segment_idx": seg_idx,
            "free_flow_speed": ffs,
            "lag_speed_1h": lag_speed,
            "lag_congestion_1h": lag_congestion,
            # No weather feed yet: training-mean temperature and dry weather.
            "temperature": 27.5,
            "is_rainy": 0,
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

        return TrafficPrediction(
            segment_id=seg["id"],
            road_name=seg["road_name"],
            horizon_minutes=horizon,
            predicted_speed=round(pred_speed, 1),
            predicted_congestion=round(congestion, 3),
            predicted_level=level,
            confidence=round(conf, 2),
            current_speed=round(max(2.0, current_speed), 1),
            current_congestion=round(calculate_congestion(current_speed, ffs), 3),
        )

    def _heuristic_predict(
        self, seg: dict, hour: int, dow: int, horizon: int, current_speed: float
    ) -> TrafficPrediction:
        """Simple heuristic when no ML model is available."""
        ffs = seg["ffs"]
        factor = _expected_time_factor(hour)
        pred_speed = ffs * (1 - factor * random.uniform(0.6, 1.0))
        pred_speed = max(2.0, round(pred_speed, 1))
        congestion = calculate_congestion(pred_speed, ffs)
        level = get_congestion_level(congestion)

        conf = 0.75 - (horizon - 15) * 0.008 + random.uniform(-0.05, 0.05)
        conf = max(0.50, min(0.95, conf))

        return TrafficPrediction(
            segment_id=seg["id"],
            road_name=seg["road_name"],
            horizon_minutes=horizon,
            predicted_speed=pred_speed,
            predicted_congestion=round(congestion, 3),
            predicted_level=level,
            confidence=round(conf, 2),
            current_speed=round(max(2.0, current_speed), 1),
            current_congestion=round(calculate_congestion(current_speed, ffs), 3),
        )
