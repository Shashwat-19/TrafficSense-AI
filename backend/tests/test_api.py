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


# ── Chat ──────────────────────────────────────────────────────────────────

def test_chat_endpoint_exists():
    """Verify the chat endpoint is registered and accepts POST."""
    response = client.post("/api/v1/chat", json={
        "message": "Hello",
    })
    # May fail due to no AWS credentials, but should not be 404 or 405
    assert response.status_code != 404
    assert response.status_code != 405


def test_chat_invalid_request():
    """Empty message should be rejected by validation."""
    response = client.post("/api/v1/chat", json={
        "message": "",
    })
    assert response.status_code == 422  # Pydantic validation error


def test_chat_missing_body():
    """Missing body should be rejected."""
    response = client.post("/api/v1/chat")
    assert response.status_code == 422


def test_chat_delete_conversation():
    """Delete conversation endpoint should work."""
    response = client.delete("/api/v1/chat/nonexistent-id")
    assert response.status_code == 200
    data = response.json()
    assert data["cleared"] is False
    assert data["conversation_id"] == "nonexistent-id"


def test_chatbot_tools_execute():
    """Verify chatbot tools can execute against real services."""
    from app.services.chatbot_tools import execute_tool

    # Test get_current_traffic tool
    result, actions = execute_tool("get_current_traffic", {})
    assert "Traffic data" in result or "segments" in result.lower()
    assert isinstance(actions, list)

    # Test with road filter
    result, actions = execute_tool("get_current_traffic", {"road_name": "MG Road"})
    assert isinstance(result, str)

    # Test get_weather tool
    result, actions = execute_tool("get_weather", {})
    assert "temperature" in result.lower() or "weather" in result.lower()

    # Test get_traffic_incidents tool
    result, actions = execute_tool("get_traffic_incidents", {})
    assert isinstance(result, str)

    # Test get_traffic_prediction tool
    result, actions = execute_tool("get_traffic_prediction", {"horizon_minutes": 30})
    assert isinstance(result, str)

    # Test get_traffic_analytics tool
    result, actions = execute_tool("get_traffic_analytics", {})
    assert "congestion" in result.lower() or "analytics" in result.lower()

    # Test get_alerts tool
    result, actions = execute_tool("get_alerts", {})
    assert isinstance(result, str)

    # Test find_route tool
    result, actions = execute_tool("find_route", {
        "origin": "Koramangala",
        "destination": "Whitefield",
    })
    assert "route" in result.lower() or "km" in result.lower()

    # Test unknown tool
    result, actions = execute_tool("nonexistent_tool", {})
    assert "unknown" in result.lower() or "Unknown" in result


def test_chatbot_conversation_store():
    """Test the conversation store directly."""
    from app.services.chatbot import ConversationStore

    store = ConversationStore(max_messages=5)

    # Empty conversation
    assert store.get_messages("test-123") == []
    assert store.exists("test-123") is False

    # Add messages
    store.add_message("test-123", "user", "Hello")
    assert store.exists("test-123") is True
    assert len(store.get_messages("test-123")) == 1

    store.add_message("test-123", "assistant", "Hi there!")
    assert len(store.get_messages("test-123")) == 2

    # Clear
    store.clear("test-123")
    assert store.exists("test-123") is False

    # Test pruning
    store2 = ConversationStore(max_messages=3)
    for i in range(5):
        store2.add_message("prune-test", "user", f"Message {i}")
    assert len(store2.get_messages("prune-test")) == 3


def test_chat_root_endpoint_includes_chat():
    """Verify the root endpoint lists the chat API."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "chat" in data["endpoints"]
    assert data["endpoints"]["chat"] == "/api/v1/chat"
