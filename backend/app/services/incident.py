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

_incident_cache: TTLCache = TTLCache(maxsize=2, ttl=settings.TRAFFIC_CACHE_TTL)

_ICON_TO_TYPE = {
    1: IncidentType.ACCIDENT,
    6: IncidentType.CONGESTION,
    7: IncidentType.ROAD_CLOSURE,
    8: IncidentType.ROAD_CLOSURE,
    9: IncidentType.CONSTRUCTION,
    11: IncidentType.OBSTRUCTION,
    14: IncidentType.OBSTRUCTION,
}

_MAGNITUDE_TO_SEVERITY = {
    0: IncidentSeverity.LOW,
    1: IncidentSeverity.LOW,
    2: IncidentSeverity.MODERATE,
    3: IncidentSeverity.HIGH,
    4: IncidentSeverity.CRITICAL,
}


class IncidentService:
    """Provides traffic incidents from TomTom or demo mode."""

    def get_incidents(
        self,
        severity: str | None = None,
        incident_type: str | None = None,
    ) -> Tuple[List[dict], str]:
        if settings.TOMTOM_API_KEY:
            items, mode = self._fetch_live_incidents()
        else:
            items, mode = self._get_demo_incidents()

        result = items
        # Apply filters
        if severity:
            result = [i for i in result if i["severity"] == severity.upper()]
        if incident_type:
            result = [i for i in result if i["type"] == incident_type.upper()]

        return result, mode

    def _get_demo_incidents(self) -> Tuple[List[dict], str]:
        cache_key = "demo_incidents"
        cached = _incident_cache.get(cache_key)
        if cached is None:
            incidents = _generate_mock_incidents()
            cached = [inc.model_dump(mode="json") for inc in incidents]
            _incident_cache[cache_key] = cached
        return cached, "demo"

    def _fetch_live_incidents(self) -> Tuple[List[dict], str]:
        cache_key = "live_incidents"
        cached = _incident_cache.get(cache_key)
        if cached is not None:
            return cached, "live"

        import httpx
        import logging
        logger = logging.getLogger(__name__)

        url = "https://api.tomtom.com/traffic/services/5/incidentDetails"
        params = {
            "bbox": "77.45,12.80,77.78,13.15",
            "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay}}}",
            "language": "en-GB",
            "categoryFilter": "0,1,2,3,4,5,6,7,8,9,10,11,14",
            "timeValidityFilter": "present",
            "key": settings.TOMTOM_API_KEY,
        }

        try:
            with httpx.Client(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = client.get(url, params=params)
                if resp.status_code == 200:
                    raw_incidents = resp.json().get("incidents", [])
                    now = datetime.now(tz=timezone.utc)
                    parsed_incidents: List[Incident] = []

                    for idx, raw in enumerate(raw_incidents[:15]):
                        props = raw.get("properties", {})
                        geom = raw.get("geometry", {})
                        coords = geom.get("coordinates", [])

                        # Derive representative coordinate (first point or point)
                        if geom.get("type") == "Point" and len(coords) >= 2:
                            lng, lat = coords[0], coords[1]
                        elif geom.get("type") == "LineString" and len(coords) > 0 and len(coords[0]) >= 2:
                            lng, lat = coords[0][0], coords[0][1]
                        else:
                            continue

                        icon_cat = props.get("iconCategory", 0)
                        mag = props.get("magnitudeOfDelay", 1)
                        inc_type = _ICON_TO_TYPE.get(icon_cat, IncidentType.OTHER)
                        inc_sev = _MAGNITUDE_TO_SEVERITY.get(mag, IncidentSeverity.MODERATE)

                        events = props.get("events", [])
                        event_desc = events[0].get("description") if events else ""
                        from_road = props.get("from") or props.get("to") or "Bangalore Corridor"
                        description = f"{event_desc} on {from_road}".strip() if event_desc else f"Traffic incident on {from_road}"

                        start_str = props.get("startTime")
                        try:
                            start_time = datetime.fromisoformat(start_str.replace("Z", "+00:00")) if start_str else now
                        except Exception:
                            start_time = now

                        parsed_incidents.append(Incident(
                            id=f"live-inc-{idx+1:03d}",
                            type=inc_type,
                            severity=inc_sev,
                            latitude=round(lat, 5),
                            longitude=round(lng, 5),
                            description=description,
                            road_name=from_road,
                            start_time=start_time,
                            end_time=None,
                            source="live",
                        ))

                    if parsed_incidents:
                        result = [inc.model_dump(mode="json") for inc in parsed_incidents]
                        _incident_cache[cache_key] = result
                        return result, "live"
                elif resp.status_code in (401, 403):
                    logger.warning("TomTom Incident API key authentication failed (HTTP %s).", resp.status_code)
        except Exception as e:
            logger.error("Error fetching live TomTom incidents: %s", e)

        return self._get_demo_incidents()
