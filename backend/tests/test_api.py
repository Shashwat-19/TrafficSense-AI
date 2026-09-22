"""
TrafficSense AI — API tests.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Health ─────────────────────────────────────────────────────────────────

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "TrafficSense AI"
    assert "endpoints" in data


# ── Traffic ────────────────────────────────────────────────────────────────

def test_get_current_traffic():
    response = client.get("/api/v1/traffic/current")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "data_mode" in data
    assert "last_updated" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0
    # Verify segment structure
    seg = data["data"][0]
    assert "id" in seg
    assert "road_name" in seg
    assert "congestion_ratio" in seg
    assert "congestion_level" in seg
    assert 0 <= seg["congestion_ratio"] <= 1


def test_get_incidents():
    response = client.get("/api/v1/traffic/incidents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["data"], list)


def test_get_incidents_with_filter():
    response = client.get("/api/v1/traffic/incidents?severity=HIGH")
    assert response.status_code == 200


# ── Weather ────────────────────────────────────────────────────────────────

def test_get_weather():
    response = client.get("/api/v1/weather")
    assert response.status_code == 200
    data = response.json()
    weather = data["data"]
    assert "temperature" in weather
    assert "condition" in weather
    assert "humidity" in weather
    assert "wind_speed" in weather
    assert "visibility" in weather


# ── Predictions ────────────────────────────────────────────────────────────

def test_get_predictions():
    response = client.get("/api/v1/predictions?horizon=15")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["data"], list)
    if data["data"]:
        pred = data["data"][0]
        assert "predicted_speed" in pred
        assert "predicted_congestion" in pred
        assert "predicted_level" in pred


def test_get_predictions_invalid_horizon():
    response = client.get("/api/v1/predictions?horizon=45")
    assert response.status_code == 400


def test_get_predictions_30min():
    response = client.get("/api/v1/predictions?horizon=30")
    assert response.status_code == 200


def test_get_predictions_60min():
    response = client.get("/api/v1/predictions?horizon=60")
    assert response.status_code == 200


# ── Routes ─────────────────────────────────────────────────────────────────

def test_post_routes():
    response = client.post("/api/v1/routes", json={
        "origin_lat": 12.9352,
        "origin_lng": 77.6245,
        "destination_lat": 12.8458,
        "destination_lng": 77.6602,
    })
    assert response.status_code == 200
    data = response.json()
    route = data["data"]
    assert "origin" in route
    assert "destination" in route
    assert "alternatives" in route
    assert len(route["alternatives"]) > 0


# ── Analytics ──────────────────────────────────────────────────────────────

def test_get_analytics():
    response = client.get("/api/v1/analytics")
    assert response.status_code == 200
    data = response.json()
    analytics = data["data"]
    assert "overall_congestion" in analytics
    assert "avg_speed" in analytics
    assert "congestion_distribution" in analytics
    assert "hourly_patterns" in analytics
    assert "top_congested_roads" in analytics


# ── Alerts ─────────────────────────────────────────────────────────────────

def test_get_alerts():
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["data"], list)


# ── Users ──────────────────────────────────────────────────────────────────

def test_get_user_preferences():
    response = client.get("/api/v1/users/preferences")
    assert response.status_code == 200
    data = response.json()
    prefs = data["data"]
    assert "notifications_enabled" in prefs
    assert "saved_locations" in prefs
    assert "recent_routes" in prefs


def test_update_user_preferences():
    response = client.put("/api/v1/users/preferences", json={
        "notifications_enabled": False,
    })
    assert response.status_code == 200
