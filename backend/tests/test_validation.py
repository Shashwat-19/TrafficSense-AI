"""
TrafficSense AI — request validation and error-handling tests.

All tests run offline: live API keys are blanked, caches are reset, and the
routes exercised here either fail validation before any service call or use
the in-memory / demo services.
"""

import pytest
from cachetools import TTLCache
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services import analytics as analytics_mod
from app.services import incident as incident_mod
from app.services import traffic as traffic_mod

ORIGIN = "http://localhost:3000"


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    """No live keys and fresh caches, so no test can reach a real API."""
    monkeypatch.setattr(settings, "TOMTOM_API_KEY", "")
    monkeypatch.setattr(settings, "OPENWEATHER_API_KEY", "")
    monkeypatch.setattr(traffic_mod, "_traffic_cache", TTLCache(maxsize=2, ttl=120))
    monkeypatch.setattr(traffic_mod, "_traffic_fallback_cache", TTLCache(maxsize=1, ttl=20))
    monkeypatch.setattr(incident_mod, "_incident_cache", TTLCache(maxsize=2, ttl=120))
    monkeypatch.setattr(incident_mod, "_incident_fallback_cache", TTLCache(maxsize=1, ttl=20))
    monkeypatch.setattr(analytics_mod, "_analytics_cache", TTLCache(maxsize=1, ttl=180))


@pytest.fixture
def client():
    return TestClient(app)


# ── Incident filters ───────────────────────────────────────────────────────

def test_invalid_incident_severity_returns_400(client):
    response = client.get("/api/v1/traffic/incidents", params={"severity": "EXTREME"})
    assert response.status_code == 400
    assert "Invalid severity" in response.json()["detail"]


def test_invalid_incident_type_returns_400(client):
    response = client.get("/api/v1/traffic/incidents", params={"incident_type": "BOGUS"})
    assert response.status_code == 400
    assert "Invalid incident type" in response.json()["detail"]


def test_lowercase_incident_severity_filter_works(client):
    response = client.get("/api/v1/traffic/incidents", params={"severity": "high"})
    assert response.status_code == 200
    items = response.json()["data"]
    assert all(item["severity"] == "HIGH" for item in items)


# ── Alert filters ──────────────────────────────────────────────────────────

def test_invalid_alert_type_returns_400(client):
    response = client.get("/api/v1/alerts", params={"alert_type": "NOT_A_TYPE"})
    assert response.status_code == 400


def test_invalid_alert_severity_returns_400(client):
    response = client.get("/api/v1/alerts", params={"severity": "LOUD"})
    assert response.status_code == 400


# ── Route request bounds ───────────────────────────────────────────────────

_ROUTE_BODY = {
    "origin_lat": 12.97,
    "origin_lng": 77.59,
    "destination_lat": 12.93,
    "destination_lng": 77.61,
}


def test_route_latitude_out_of_range_returns_422(client):
    response = client.post("/api/v1/routes", json={**_ROUTE_BODY, "origin_lat": 95})
    assert response.status_code == 422


def test_route_longitude_out_of_range_returns_422(client):
    response = client.post("/api/v1/routes", json={**_ROUTE_BODY, "destination_lng": 200})
    assert response.status_code == 422


# ── Preferences update ─────────────────────────────────────────────────────

def test_preferences_unknown_key_returns_422(client):
    response = client.put("/api/v1/users/preferences", json={"not_a_field": 1})
    assert response.status_code == 422


def test_preferences_oversized_list_returns_422(client):
    response = client.put(
        "/api/v1/users/preferences",
        json={"favorite_areas": [f"area-{i}" for i in range(51)]},
    )
    assert response.status_code == 422


def test_preferences_notifications_only_returns_200(client):
    response = client.put("/api/v1/users/preferences", json={"notifications_enabled": False})
    assert response.status_code == 200


# ── Chat conversation IDs ──────────────────────────────────────────────────

def test_chat_bad_conversation_id_returns_422(client):
    response = client.post(
        "/api/v1/chat",
        json={"message": "hello", "conversation_id": "bad id!"},
    )
    assert response.status_code == 422


def test_clear_chat_bad_id_returns_422(client):
    response = client.delete("/api/v1/chat/bad.id")
    assert response.status_code == 422


def test_clear_chat_overlong_id_returns_422(client):
    response = client.delete(f"/api/v1/chat/{'a' * 65}")
    assert response.status_code == 422


# ── Predictions ────────────────────────────────────────────────────────────

def test_prediction_unknown_segment_returns_404(client):
    response = client.get("/api/v1/predictions", params={"segment_id": "seg-999"})
    assert response.status_code == 404
    assert "Unknown segment_id" in response.json()["detail"]


# ── Unhandled errors keep CORS headers ─────────────────────────────────────

def test_unhandled_error_returns_500_with_cors_headers():
    def _boom():
        raise RuntimeError("deliberate test failure")

    # Temporary route, registered only for this test and removed afterwards
    app.add_api_route("/api/v1/__test_boom", _boom, methods=["GET"])
    try:
        boom_client = TestClient(app, raise_server_exceptions=False)
        response = boom_client.get("/api/v1/__test_boom", headers={"Origin": ORIGIN})
    finally:
        app.router.routes = [
            r for r in app.router.routes
            if not (isinstance(r, APIRoute) and r.path == "/api/v1/__test_boom")
        ]

    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error"}
    assert response.headers.get("access-control-allow-origin") == ORIGIN
