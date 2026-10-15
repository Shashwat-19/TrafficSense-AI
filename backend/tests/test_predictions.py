"""Predictions must agree with /traffic/current, whose live free-flow speed differs from the static one."""

import pytest
from cachetools import TTLCache

from app.services import prediction as prediction_mod
from app.services.prediction import PredictionService
from app.services.traffic import BANGALORE_SEGMENTS, calculate_congestion


@pytest.fixture
def live_traffic(monkeypatch):
    """Live traffic where every road's free-flow speed is 70% of the static one and speed is 80% of that."""
    segments = []
    for seg in BANGALORE_SEGMENTS:
        live_ffs = seg["ffs"] * 0.7
        speed = live_ffs * 0.8
        segments.append({
            "id": seg["id"], "current_speed": speed, "free_flow_speed": live_ffs,
            "congestion_ratio": round(calculate_congestion(speed, live_ffs), 3),
        })
    monkeypatch.setattr(prediction_mod._traffic_service, "get_current_traffic", lambda: (segments, "live"))
    monkeypatch.setattr(prediction_mod, "_prediction_cache", TTLCache(maxsize=64, ttl=60))
    return {s["id"]: s for s in segments}


@pytest.mark.parametrize("model", [True, False])
def test_predictions_match_live_traffic(live_traffic, monkeypatch, model):
    if not model:
        monkeypatch.setattr(prediction_mod, "_load_model", lambda: None)
    preds, _ = PredictionService().get_predictions()
    assert len(preds) == len(BANGALORE_SEGMENTS)
    for p in preds:
        live = live_traffic[p["segment_id"]]
        assert p["current_congestion"] == pytest.approx(live["congestion_ratio"], abs=1e-3)
        assert p["current_speed"] == pytest.approx(live["current_speed"], abs=0.1)
        assert p["predicted_speed"] <= live["free_flow_speed"] + 0.1  # never faster than the road's live free flow
