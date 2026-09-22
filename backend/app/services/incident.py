"""
TrafficSense AI — Incident service.

Generates realistic Bangalore traffic incidents for demo mode.
"""

import random
from datetime import datetime, timezone, timedelta
from typing import List, Tuple
from cachetools import TTLCache

from app.core.config import settings
from app.models.schemas import Incident, IncidentType, IncidentSeverity


# ── Bangalore incident templates ───────────────────────────────────────────

_INCIDENT_TEMPLATES = [
    {
        "road": "Silk Board Junction",
        "lat": 12.9177, "lng": 77.6238,
        "desc": "Multi-vehicle collision causing major delays",
        "type": IncidentType.ACCIDENT, "severity": IncidentSeverity.HIGH,
    },
    {
        "road": "Outer Ring Road (Marathahalli)",
        "lat": 12.9537, "lng": 77.7012,
        "desc": "Road repair work – single lane operational",
        "type": IncidentType.CONSTRUCTION, "severity": IncidentSeverity.MODERATE,
    },
    {
        "road": "Hebbal Flyover",
        "lat": 13.0358, "lng": 77.5970,
        "desc": "Vehicle breakdown blocking right lane",
        "type": IncidentType.OBSTRUCTION, "severity": IncidentSeverity.LOW,
    },
    {
        "road": "KR Puram Bridge",
        "lat": 12.9996, "lng": 77.7041,
        "desc": "Heavy congestion due to peak-hour traffic",
        "type": IncidentType.CONGESTION, "severity": IncidentSeverity.HIGH,
    },
    {
        "road": "Bannerghatta Road",
        "lat": 12.8880, "lng": 77.5972,
        "desc": "Waterlogging due to heavy rain – proceed with caution",
        "type": IncidentType.OBSTRUCTION, "severity": IncidentSeverity.MODERATE,
    },
    {
        "road": "Mysore Road",
        "lat": 12.9500, "lng": 77.5100,
        "desc": "Metro construction – lane closure until further notice",
        "type": IncidentType.CONSTRUCTION, "severity": IncidentSeverity.HIGH,
    },
    {
        "road": "Hosur Road",
        "lat": 12.8900, "lng": 77.6400,
        "desc": "Minor fender-bender – cleared within 30 minutes",
        "type": IncidentType.ACCIDENT, "severity": IncidentSeverity.LOW,
    },
    {
        "road": "Electronic City Flyover",
        "lat": 12.8458, "lng": 77.6602,
        "desc": "VIP movement – temporary road closure",
        "type": IncidentType.ROAD_CLOSURE, "severity": IncidentSeverity.CRITICAL,
    },
    {
        "road": "Whitefield Main Road",
        "lat": 12.9698, "lng": 77.7500,
        "desc": "Fallen tree obstructing traffic",
        "type": IncidentType.OBSTRUCTION, "severity": IncidentSeverity.MODERATE,
    },
    {
        "road": "Indiranagar 100 Feet Road",
        "lat": 12.9784, "lng": 77.6408,
        "desc": "Festival procession – expect delays",
        "type": IncidentType.OTHER, "severity": IncidentSeverity.LOW,
    },
    {
        "road": "Bellary Road",
        "lat": 13.0100, "lng": 77.5750,
        "desc": "Signal malfunction at major intersection",
        "type": IncidentType.OTHER, "severity": IncidentSeverity.MODERATE,
    },
    {
        "road": "Sarjapur Road",
        "lat": 12.9100, "lng": 77.6850,
        "desc": "Severe congestion – estimated 25 min delay",
        "type": IncidentType.CONGESTION, "severity": IncidentSeverity.HIGH,
    },
]


def _generate_mock_incidents() -> List[Incident]:
    """Pick a random subset of incidents to simulate live conditions."""
    now = datetime.now(tz=timezone.utc)
    hour = (now.hour + 5) % 24  # IST

    # More incidents during peak hours
    if 8 <= hour <= 10 or 17 <= hour <= 20:
        count = random.randint(4, 8)
    elif 22 <= hour or hour <= 5:
        count = random.randint(0, 2)
    else:
        count = random.randint(2, 5)

    selected = random.sample(_INCIDENT_TEMPLATES, min(count, len(_INCIDENT_TEMPLATES)))
    incidents: List[Incident] = []

    for i, tmpl in enumerate(selected):
        start = now - timedelta(minutes=random.randint(5, 120))
        end = start + timedelta(minutes=random.randint(30, 240)) if random.random() > 0.3 else None
        incidents.append(Incident(
            id=f"inc-{i+1:03d}",
            type=tmpl["type"],
            severity=tmpl["severity"],
            latitude=tmpl["lat"],
            longitude=tmpl["lng"],
            description=tmpl["desc"],
            road_name=tmpl["road"],
            start_time=start,
            end_time=end,
            source="demo",
        ))

    return incidents


# ── Cache ──────────────────────────────────────────────────────────────────

_incident_cache: TTLCache = TTLCache(maxsize=1, ttl=settings.TRAFFIC_CACHE_TTL)


class IncidentService:
    """Provides traffic incidents from TomTom or demo mode."""

    def get_incidents(
        self,
        severity: str | None = None,
        incident_type: str | None = None,
    ) -> Tuple[List[dict], str]:
        cache_key = "demo_incidents"
        cached = _incident_cache.get(cache_key)
        if cached is None:
            incidents = _generate_mock_incidents()
            cached = [inc.model_dump(mode="json") for inc in incidents]
            _incident_cache[cache_key] = cached

        result = cached

        # Apply filters
        if severity:
            result = [i for i in result if i["severity"] == severity.upper()]
        if incident_type:
            result = [i for i in result if i["type"] == incident_type.upper()]

        return result, "demo"
