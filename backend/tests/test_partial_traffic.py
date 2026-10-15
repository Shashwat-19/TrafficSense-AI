"""
TrafficSense AI — partial live traffic tests.

Runs offline: TomTom calls are answered by httpx.MockTransport. One segment
always fails, so every live result is partial.
"""

import threading
import time

import httpx
from cachetools import TTLCache
from fastapi.testclient import TestClient

from app.main import app
from app.services import traffic as traffic_mod

FAILING_POINT = "13.0358,77.597"  # Hebbal Flyover, seg-016
FAILING_ROAD = "Hebbal Flyover"


def _setup(monkeypatch):
    calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request.url.params["point"])
        time.sleep(0.01)  # keep concurrent callers overlapping
        if request.url.params["point"] == FAILING_POINT:
            return httpx.Response(500)
        return httpx.Response(200, json={"flowSegmentData": {
            "currentSpeed": 20, "freeFlowSpeed": 40, "confidence": 0.9,
            "currentTravelTime": 100, "freeFlowTravelTime": 60,
        }})

    real_client = httpx.Client
    monkeypatch.setattr(
        httpx, "Client",
        lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw),
    )
    monkeypatch.setattr(traffic_mod.settings, "TOMTOM_API_KEY", "offline-test-key")
    monkeypatch.setattr(traffic_mod, "_traffic_cache", TTLCache(maxsize=2, ttl=120))
    monkeypatch.setattr(traffic_mod, "_traffic_partial_cache", TTLCache(maxsize=1, ttl=60))
    monkeypatch.setattr(traffic_mod, "_traffic_fallback_cache", TTLCache(maxsize=1, ttl=60))
    return calls


def test_partial_live_result_is_returned_live_cached_briefly_and_reports_missing(monkeypatch):
    calls = _setup(monkeypatch)
    service = traffic_mod.TrafficService()
    n = len(traffic_mod.BANGALORE_SEGMENTS)

    data, mode = service.get_current_traffic()
    assert mode == "live"
    assert len(data) == n - 1
    assert service.get_last_missing() == [FAILING_ROAD]
    assert len(calls) == n

    # Within the window the partial result is served from cache: no new TomTom calls
    data, mode = service.get_current_traffic()
    assert mode == "live"
    assert len(data) == n - 1
    assert service.get_last_missing() == [FAILING_ROAD]
    assert len(calls) == n


def test_endpoint_warns_about_missing_segments(monkeypatch):
    _setup(monkeypatch)
    monkeypatch.setattr(traffic_mod, "_traffic_partial_cache", TTLCache(maxsize=1, ttl=60))

    body = TestClient(app).get("/api/v1/traffic/current").json()
    assert body["data_mode"] == "live"
    assert body["warnings"] == [f"Missing live data for: {FAILING_ROAD}"]
    assert len(body["data"]) == len(traffic_mod.BANGALORE_SEGMENTS) - 1


def test_concurrent_cold_requests_fetch_tomtom_once(monkeypatch):
    calls = _setup(monkeypatch)
    service = traffic_mod.TrafficService()
    threads = [threading.Thread(target=service.get_current_traffic) for _ in range(4)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert len(calls) == len(traffic_mod.BANGALORE_SEGMENTS)
