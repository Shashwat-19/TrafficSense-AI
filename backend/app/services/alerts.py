"""
TrafficSense AI — Alerts service.

Generates traffic alerts based on current conditions: severe congestion,
major incidents, weather risks, and significant traffic changes.
"""

import random
from datetime import datetime, timezone, timedelta
from typing import List, Tuple
from cachetools import TTLCache

from app.core.config import settings
from app.models.schemas import Alert, AlertType, AlertSeverity, CongestionLevel


# ── Cache ──────────────────────────────────────────────────────────────────

_alerts_cache: TTLCache = TTLCache(maxsize=1, ttl=settings.TRAFFIC_CACHE_TTL)


def _generate_demo_alerts() -> List[Alert]:
    """Generate alerts from current traffic and weather conditions."""
    now = datetime.now(tz=timezone.utc)
    hour = (now.hour + 5) % 24
    alerts: List[Alert] = []

    # ── Congestion alerts ──────────────────────────────────────────────
    _congestion_alerts = [
        {
            "road": "Silk Board Junction",
            "lat": 12.9177, "lng": 77.6238,
            "title": "Severe Congestion – Silk Board Junction",
            "msg": "Congestion ratio exceeds 85%. Estimated delay: 25 minutes. Consider alternate routes via Hosur Road.",
            "type": AlertType.SEVERE_CONGESTION,
            "severity": AlertSeverity.CRITICAL,
        },
        {
            "road": "Outer Ring Road (Marathahalli)",
            "lat": 12.9537, "lng": 77.7012,
            "title": "Heavy Traffic – ORR Marathahalli",
            "msg": "Speed dropped to 8 km/h on Outer Ring Road near Marathahalli. 15-minute delay expected.",
            "type": AlertType.SEVERE_CONGESTION,
            "severity": AlertSeverity.WARNING,
        },
        {
            "road": "KR Puram Bridge",
            "lat": 12.9996, "lng": 77.7041,
            "title": "Traffic Build-up – KR Puram",
            "msg": "Significant traffic increase detected on KR Puram Bridge. Travel time increased by 20 minutes.",
            "type": AlertType.TRAFFIC_INCREASE,
            "severity": AlertSeverity.WARNING,
        },
    ]

    _incident_alerts = [
        {
            "road": "Electronic City Flyover",
            "lat": 12.8458, "lng": 77.6602,
            "title": "Road Closure – Electronic City",
            "msg": "VIP movement causing temporary road closure on Electronic City Flyover. Expect 30-minute delays.",
            "type": AlertType.MAJOR_INCIDENT,
            "severity": AlertSeverity.CRITICAL,
        },
        {
            "road": "Mysore Road",
            "lat": 12.9500, "lng": 77.5100,
            "title": "Construction – Mysore Road",
            "msg": "Metro construction has closed the left lane on Mysore Road. Delays of 10-15 minutes.",
            "type": AlertType.MAJOR_INCIDENT,
            "severity": AlertSeverity.WARNING,
        },
    ]

    _weather_alerts = [
        {
            "road": None,
            "lat": 12.9716, "lng": 77.5946,
            "title": "Rain Advisory – Bangalore",
            "msg": "Heavy rain expected in the next 2 hours. Roads may be waterlogged in low-lying areas. Drive cautiously.",
            "type": AlertType.WEATHER_RISK,
            "severity": AlertSeverity.WARNING,
        },
        {
            "road": "Bannerghatta Road",
            "lat": 12.8880, "lng": 77.5972,
            "title": "Waterlogging Risk – Bannerghatta Road",
            "msg": "Moderate rain with possible waterlogging near Bannerghatta Road. Reduced visibility expected.",
            "type": AlertType.WEATHER_RISK,
            "severity": AlertSeverity.INFO,
        },
    ]

    _route_alerts = [
        {
            "road": "Hosur Road",
            "lat": 12.8900, "lng": 77.6400,
            "title": "Route Delay – Hosur Road",
            "msg": "Your saved route via Hosur Road is experiencing a 12-minute additional delay due to an accident.",
            "type": AlertType.ROUTE_DELAY,
            "severity": AlertSeverity.INFO,
        },
    ]

    # Pick alerts based on time of day
    if 8 <= hour <= 10 or 17 <= hour <= 20:
        # Peak hours: more alerts
        pool = _congestion_alerts + _incident_alerts + _weather_alerts + _route_alerts
        count = random.randint(4, 7)
    elif 22 <= hour or hour <= 5:
        pool = _weather_alerts[:1]
        count = random.randint(0, 1)
    else:
        pool = _congestion_alerts[:1] + _incident_alerts[:1] + _weather_alerts[:1]
        count = random.randint(1, 3)

    selected = random.sample(pool, min(count, len(pool)))

    for i, tmpl in enumerate(selected):
        alerts.append(Alert(
            id=f"alert-{i+1:03d}",
            type=tmpl["type"],
            severity=tmpl["severity"],
            title=tmpl["title"],
            message=tmpl["msg"],
            latitude=tmpl["lat"],
            longitude=tmpl["lng"],
            road_name=tmpl.get("road"),
            is_read=False,
            created_at=now - timedelta(minutes=random.randint(1, 60)),
            expires_at=now + timedelta(hours=random.randint(1, 4)),
        ))

    return alerts


class AlertsService:
    """Provides traffic alerts."""

    def get_alerts(
        self,
        alert_type: str | None = None,
        severity: str | None = None,
    ) -> Tuple[List[dict], str]:
        cache_key = "alerts"
        cached = _alerts_cache.get(cache_key)
        if cached is None:
            alerts = _generate_demo_alerts()
            cached = [a.model_dump(mode="json") for a in alerts]
            _alerts_cache[cache_key] = cached

        result = cached

        if alert_type:
            result = [a for a in result if a["type"] == alert_type.upper()]
        if severity:
            result = [a for a in result if a["severity"] == severity.upper()]

        return result, "demo"
