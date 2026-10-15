"""
TrafficSense AI — Prediction service.

Uses a trained XGBoost model (when available) or heuristic fallback to
predict traffic conditions at 15 / 30 / 60 minute horizons.
"""

import logging
import os
import random
from datetime import datetime, timedelta, timezone
from typing import List, Tuple

import pandas as pd

from cachetools import TTLCache

from app.core.config import settings
from app.models.schemas import TrafficPrediction
from app.services.traffic import (
    BANGALORE_SEGMENTS,
    TrafficService,
    cache_get,
    cache_set,
    calculate_congestion,
    IST,
    expected_time_factor as _expected_time_factor,
    get_congestion_level,
)
from app.services.weather import WeatherService

logger = logging.getLogger(__name__)

_MODEL = None  # None: not tried yet, False: load failed (heuristic only)
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "models", "artifacts", "xgb_speed_model.pkl"
)
_traffic_service = TrafficService()
_weather_service = WeatherService()

# Entries are (result, oldest traffic timestamp used); a hit is dropped once that traffic is older than
# TRAFFIC_CACHE_TTL, so a served current_speed is never staler than the traffic cache allows.
_prediction_cache: TTLCache = TTLCache(
    maxsize=64, ttl=min(settings.PREDICTION_CACHE_TTL, settings.TRAFFIC_CACHE_TTL)
)


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


def _modelled_speed(ffs: float, hour: int, dow: int) -> float:
    """Deterministic expected speed, mirroring the training data's weekend effect."""
    factor = _expected_time_factor(hour) * (0.6 if dow >= 5 else 1.0)
    return max(2.0, ffs * (1 - factor))


def _current_weather() -> Tuple[float, int]:
    """(temperature, is_rainy) from the weather service; training-mean placeholders on any error."""
    try:
        weather, _ = _weather_service.get_weather()
        temperature = float(weather["temperature"])
        is_rainy = int(weather.get("condition") in ("Rain", "Thunderstorm"))  # same rule as weather.py
        return temperature, is_rainy
    except Exception:
        logger.warning("Weather unavailable for prediction; using placeholder temperature and dry weather.")
        return 27.5, 0


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

        cache_key = (segment_id, horizon)
        cached = cache_get(_prediction_cache, cache_key)
        if cached is not None:
            result, traffic_born = cached
            if datetime.now(timezone.utc) - traffic_born < timedelta(seconds=settings.TRAFFIC_CACHE_TTL):
                return result

        model = _load_model()
        temperature, is_rainy = _current_weather()

        # Same source as /traffic/current, so current_speed agrees with it.
        traffic, traffic_mode = _traffic_service.get_current_traffic()
        live = {t["id"]: t for t in traffic}
        # Segments without a timestamp (not expected) count as fresh.
        traffic_born = min(
            (datetime.fromisoformat(t["timestamp"]) for t in traffic if t.get("timestamp")),
            default=datetime.now(timezone.utc),
        )
        use_live_lag = traffic_mode == "live"

        now = datetime.now(tz=IST)
        target = now + timedelta(minutes=horizon)
        target_hour, target_dow = target.hour, target.weekday()
        # Previous hour of the target, the lag the model was trained with.
        prev = target - timedelta(hours=1)
        prev_hour, prev_dow = prev.hour, prev.weekday()

        predictions: List[TrafficPrediction] = []

        for seg in segments:
            ffs = seg["ffs"]
            speed_scale = 1.0
            if seg["id"] in live:
                current_speed = live[seg["id"]]["current_speed"]
                # Live free-flow speed differs from seg["ffs"], so reuse traffic's own ratio to stay consistent with it.
                current_congestion = live[seg["id"]]["congestion_ratio"]
                if live[seg["id"]]["free_flow_speed"] > 0:
                    speed_scale = live[seg["id"]]["free_flow_speed"] / ffs
            else:
                current_speed = _modelled_speed(ffs, now.hour, now.weekday())
                current_congestion = calculate_congestion(current_speed, ffs)

            if use_live_lag:
                # The model works in static-ffs terms, so express the live congestion on that scale.
                lag_speed = ffs * (1 - current_congestion)
            else:
                lag_speed = _modelled_speed(ffs, prev_hour, prev_dow)

            if model is not None:
                pred = self._ml_predict(
                    model, seg, target_hour, target_dow, horizon, lag_speed, current_speed,
                    current_congestion, speed_scale, temperature, is_rainy,
                )
                mode = "ml_prediction"
            else:
                pred = self._heuristic_predict(
                    seg, target_hour, target_dow, horizon, current_speed, current_congestion, speed_scale
                )
                mode = "heuristic"

            predictions.append(pred)

        result = ([p.model_dump(mode="json") for p in predictions], mode)
        cache_set(_prediction_cache, cache_key, (result, traffic_born))
        return result

    def _ml_predict(
        self, model, seg: dict, hour: int, dow: int, horizon: int,
        lag_speed: float, current_speed: float, current_congestion: float,
        speed_scale: float, temperature: float, is_rainy: int,
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
            "temperature": temperature,
            "is_rainy": is_rainy,
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
            predicted_speed=round(pred_speed * speed_scale, 1),
            predicted_congestion=round(congestion, 3),
            predicted_level=level,
            confidence=round(conf, 2),
            current_speed=round(max(2.0, current_speed), 1),
            current_congestion=round(current_congestion, 3),
        )

    def _heuristic_predict(
        self, seg: dict, hour: int, dow: int, horizon: int, current_speed: float,
        current_congestion: float, speed_scale: float,
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
            predicted_speed=round(pred_speed * speed_scale, 1),
            predicted_congestion=round(congestion, 3),
            predicted_level=level,
            confidence=round(conf, 2),
            current_speed=round(max(2.0, current_speed), 1),
            current_congestion=round(current_congestion, 3),
        )
