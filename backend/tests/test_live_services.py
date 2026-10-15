"""
TrafficSense AI — live-service parsing, fallback and derived-data tests.

Every HTTP call goes through httpx.MockTransport, API keys are dummy strings
set on settings, and service caches are replaced with fresh ones per test.
"""

import hashlib
import httpx
import pytest
from cachetools import TTLCache

from app.core.config import settings
from app.services import alerts as alerts_mod
from app.services import analytics as analytics_mod
from app.services import incident as incident_mod
from app.services import traffic as traffic_mod
from app.services import weather as weather_mod
from app.services.alerts import AlertsService
from app.services.analytics import AnalyticsService
from app.services.incident import IncidentService
from app.services.traffic import TrafficService
from app.services.weather import WeatherService

DUMMY_KEY = "offline-test-key"


@pytest.fixture(autouse=True)
def fresh_caches(monkeypatch):
    """Replace every service cache so tests never see each other's results."""
    monkeypatch.setattr(settings, "TOMTOM_API_KEY", "")
    monkeypatch.setattr(settings, "OPENWEATHER_API_KEY", "")
    monkeypatch.setattr(traffic_mod, "_traffic_cache", TTLCache(maxsize=2, ttl=settings.TRAFFIC_CACHE_TTL))
    monkeypatch.setattr(traffic_mod, "_traffic_fallback_cache", TTLCache(maxsize=1, ttl=traffic_mod.FALLBACK_CACHE_TTL))
    monkeypatch.setattr(incident_mod, "_incident_cache", TTLCache(maxsize=2, ttl=settings.TRAFFIC_CACHE_TTL))
    monkeypatch.setattr(incident_mod, "_incident_fallback_cache", TTLCache(maxsize=1, ttl=traffic_mod.FALLBACK_CACHE_TTL))
    monkeypatch.setattr(weather_mod, "_weather_cache", TTLCache(maxsize=2, ttl=settings.WEATHER_CACHE_TTL))
    monkeypatch.setattr(weather_mod, "_weather_fallback_cache", TTLCache(maxsize=1, ttl=traffic_mod.FALLBACK_CACHE_TTL))
    monkeypatch.setattr(analytics_mod, "_analytics_cache", TTLCache(maxsize=1, ttl=settings.ANALYTICS_CACHE_TTL))


def _mock_httpx(monkeypatch, handler) -> list[str]:
    """Route every httpx.Client through a MockTransport; returns the list of requested URLs."""
    calls: list[str] = []

    def wrapped(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        return handler(request)

    real_client = httpx.Client
    monkeypatch.setattr(
        httpx, "Client",
        lambda **kw: real_client(transport=httpx.MockTransport(wrapped), **kw),
    )
    return calls


# ── Weather ────────────────────────────────────────────────────────────────

OPENWEATHER_PAYLOAD = {
    "weather": [{"main": "Clouds", "description": "scattered clouds", "icon": "03d"}],
    "main": {"temp": 27.5, "feels_like": 29.0, "humidity": 60, "pressure": 1011},
    "wind": {"speed": 3.1, "deg": 240},
    "visibility": 9000,
    "rain": {"1h": 0.5},
}


def test_weather_live_payload_is_parsed(monkeypatch):
    monkeypatch.setattr(settings, "OPENWEATHER_API_KEY", DUMMY_KEY)
    calls = _mock_httpx(monkeypatch, lambda req: httpx.Response(200, json=OPENWEATHER_PAYLOAD))

    data, mode = WeatherService().get_weather()

    assert mode == "live"
    assert len(calls) == 1
    assert data["source"] == "live"
    assert data["temperature"] == 27.5
    assert data["feels_like"] == 29.0
    assert data["condition"] == "Clouds"
    assert data["description"] == "scattered clouds"
    assert data["icon"] == "03d"
    assert data["humidity"] == 60.0
    assert data["wind_speed"] == 3.1
    assert data["wind_direction"] == 240
    assert data["visibility"] == 9000.0
    assert data["precipitation"] == 0.5
    assert data["pressure"] == 1011


def test_weather_non_200_falls_back_to_demo_with_short_ttl(monkeypatch):
    monkeypatch.setattr(settings, "OPENWEATHER_API_KEY", DUMMY_KEY)
    calls = _mock_httpx(monkeypatch, lambda req: httpx.Response(503, json={"message": "down"}))
    service = WeatherService()

    data, mode = service.get_weather()

    assert mode == "demo"
    assert data["source"] == "demo"
    assert len(calls) == 1

    # The fallback sits in the short-TTL cache, not the normal live/demo cache
    assert "live_weather" in weather_mod._weather_fallback_cache
    assert "live_weather" not in weather_mod._weather_cache
    assert weather_mod._weather_fallback_cache.ttl == traffic_mod.FALLBACK_CACHE_TTL
    assert traffic_mod.FALLBACK_CACHE_TTL < settings.WEATHER_CACHE_TTL

    # A repeat request inside the fallback window does not call OpenWeather again
    _, mode = service.get_weather()
    assert mode == "demo"
    assert len(calls) == 1


# ── Incident stable IDs ────────────────────────────────────────────────────

def _tomtom_incidents_handler(request: httpx.Request) -> httpx.Response:
    if "incidentDetails" not in str(request.url):
        return httpx.Response(500)
    return httpx.Response(200, json={"incidents": [
        {   # TomTom supplies its own id
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [77.7012, 12.9537]},
            "properties": {
                "id": "tt-123",
                "iconCategory": 1,
                "magnitudeOfDelay": 3,
                "events": [{"description": "Collision"}],
                "from": "Outer Ring Road",
                "startTime": "2026-10-15T08:00:00Z",
            },
        },
        {   # No id anywhere: a hash of type and location is used instead
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [77.6238, 12.9177]},
            "properties": {
                "iconCategory": 6,
                "magnitudeOfDelay": 2,
                "events": [],
                "from": "Silk Board",
            },
        },
    ]})


def test_incident_ids_use_tomtom_id_or_hash_fallback(monkeypatch):
    monkeypatch.setattr(settings, "TOMTOM_API_KEY", DUMMY_KEY)
    _mock_httpx(monkeypatch, _tomtom_incidents_handler)

    items, mode = IncidentService().get_incidents()

    assert mode == "live"
    by_road = {item["road_name"]: item for item in items}

    assert by_road["Outer Ring Road"]["id"] == "live-inc-tt-123"

    expected_hash = hashlib.sha1("CONGESTION|12.9177|77.6238".encode()).hexdigest()[:12]
    assert by_road["Silk Board"]["id"] == f"live-inc-{expected_hash}"
    assert by_road["Silk Board"]["type"] == "CONGESTION"


# ── Alerts from mocked traffic and incidents ───────────────────────────────

class _FakeTraffic:
    def __init__(self, mode: str):
        self._mode = mode
        self.segments = [
            {
                "id": "seg-001", "road_name": "MG Road", "latitude": 12.9757, "longitude": 77.6062,
                "current_speed": 5.0, "free_flow_speed": 40.0, "congestion_ratio": 0.875,
                "congestion_level": "SEVERE", "delay_seconds": 420.0,
            },
            {
                "id": "seg-002", "road_name": "Hebbal Flyover", "latitude": 13.0358, "longitude": 77.5970,
                "current_speed": 50.0, "free_flow_speed": 55.0, "congestion_ratio": 0.091,
                "congestion_level": "LOW", "delay_seconds": 10.0,
            },
        ]

    def get_current_traffic(self):
        return self.segments, self._mode


class _FakeIncidents:
    def __init__(self, mode: str):
        self._mode = mode
        self.items = [
            {
                "id": "live-inc-tt-123", "type": "ACCIDENT", "severity": "HIGH",
                "latitude": 12.9537, "longitude": 77.7012, "description": "Collision",
                "road_name": "Outer Ring Road",
            },
            {
                "id": "inc-009", "type": "OTHER", "severity": "LOW",
                "latitude": 12.9784, "longitude": 77.6408, "description": "Procession",
                "road_name": "Indiranagar",
            },
        ]

    def get_incidents(self, severity=None, incident_type=None):
        return self.items, self._mode


def _alerts_with(monkeypatch, traffic_mode: str, incident_mode: str):
    monkeypatch.setattr(alerts_mod, "TrafficService", lambda: _FakeTraffic(traffic_mode))
    monkeypatch.setattr(alerts_mod, "IncidentService", lambda: _FakeIncidents(incident_mode))
    return AlertsService()


def test_alert_ids_and_severity_from_traffic_and_incidents(monkeypatch):
    items, mode = _alerts_with(monkeypatch, "live", "live").get_alerts()

    assert sorted(item["id"] for item in items) == [
        "alert-inc-live-inc-tt-123",
        "alert-seg-seg-001",
    ]
    by_id = {item["id"]: item for item in items}
    assert by_id["alert-seg-seg-001"]["type"] == "SEVERE_CONGESTION"
    assert by_id["alert-seg-seg-001"]["severity"] == "CRITICAL"
    assert by_id["alert-inc-live-inc-tt-123"]["type"] == "MAJOR_INCIDENT"
    assert by_id["alert-inc-live-inc-tt-123"]["severity"] == "WARNING"
    assert mode == "live"


@pytest.mark.parametrize("traffic_mode, incident_mode", [
    ("live", "demo"),
    ("demo", "live"),
    ("demo", "demo"),
])
def test_alert_mode_is_demo_unless_both_sources_live(monkeypatch, traffic_mode, incident_mode):
    _, mode = _alerts_with(monkeypatch, traffic_mode, incident_mode).get_alerts()
    assert mode == "demo"


# ── Analytics reports the traffic mode ─────────────────────────────────────

@pytest.mark.parametrize("traffic_mode", ["live", "demo"])
def test_analytics_reports_traffic_mode(monkeypatch, traffic_mode):
    segments = [s.model_dump(mode="json") for s in traffic_mod._generate_mock_segments()]
    monkeypatch.setattr(
        TrafficService, "get_current_traffic",
        lambda self: (segments, traffic_mode),
    )

    data, mode = AnalyticsService().get_analytics()

    assert mode == traffic_mode
    assert data["total_segments"] == len(segments)


def test_analytics_caches_only_live_results(monkeypatch):
    segments = [s.model_dump(mode="json") for s in traffic_mod._generate_mock_segments()]
    monkeypatch.setattr(TrafficService, "get_current_traffic", lambda self: (segments, "demo"))

    AnalyticsService().get_analytics()

    assert "analytics" not in analytics_mod._analytics_cache
