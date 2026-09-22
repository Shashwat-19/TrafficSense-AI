"""
TrafficSense AI — Traffic service.

Handles fetching traffic data from TomTom API (live) or generating
realistic time-varying mock data for Bangalore (demo mode).
"""

import random
import math
from datetime import datetime, timezone
from typing import List, Tuple
from cachetools import TTLCache, cached

from app.core.config import settings
from app.models.schemas import TrafficSegment, CongestionLevel


# ── Congestion calculation ─────────────────────────────────────────────────

def calculate_congestion(current_speed: float, free_flow_speed: float) -> float:
    """Calculate congestion ratio: 0 = free flow, 1 = standstill."""
    if free_flow_speed <= 0:
        return 1.0
    ratio = 1.0 - (current_speed / free_flow_speed)
    return max(0.0, min(1.0, ratio))


def get_congestion_level(ratio: float) -> CongestionLevel:
    """Map congestion ratio to a level using configurable thresholds."""
    if ratio < settings.CONGESTION_LOW:
        return CongestionLevel.LOW
    elif ratio < settings.CONGESTION_MODERATE:
        return CongestionLevel.MODERATE
    elif ratio < settings.CONGESTION_HIGH:
        return CongestionLevel.HIGH
    return CongestionLevel.SEVERE


# ── Bangalore road segments ────────────────────────────────────────────────
# Real roads with approximate coordinates and typical free-flow speeds

BANGALORE_SEGMENTS = [
    {"id": "seg-001", "road_name": "MG Road", "lat": 12.9757, "lng": 77.6062, "ffs": 40.0},
    {"id": "seg-002", "road_name": "Silk Board Junction", "lat": 12.9177, "lng": 77.6238, "ffs": 35.0},
    {"id": "seg-003", "road_name": "Outer Ring Road (Marathahalli)", "lat": 12.9537, "lng": 77.7012, "ffs": 50.0},
    {"id": "seg-004", "road_name": "Outer Ring Road (Bellandur)", "lat": 12.9262, "lng": 77.6762, "ffs": 50.0},
    {"id": "seg-005", "road_name": "Whitefield Main Road", "lat": 12.9698, "lng": 77.7500, "ffs": 45.0},
    {"id": "seg-006", "road_name": "Electronic City Flyover", "lat": 12.8458, "lng": 77.6602, "ffs": 55.0},
    {"id": "seg-007", "road_name": "Hosur Road", "lat": 12.8900, "lng": 77.6400, "ffs": 45.0},
    {"id": "seg-008", "road_name": "Koramangala Inner Ring Road", "lat": 12.9352, "lng": 77.6245, "ffs": 35.0},
    {"id": "seg-009", "road_name": "Indiranagar 100 Feet Road", "lat": 12.9784, "lng": 77.6408, "ffs": 35.0},
    {"id": "seg-010", "road_name": "Brigade Road", "lat": 12.9722, "lng": 77.6070, "ffs": 30.0},
    {"id": "seg-011", "road_name": "Bannerghatta Road", "lat": 12.8880, "lng": 77.5972, "ffs": 40.0},
    {"id": "seg-012", "road_name": "Tumkur Road (NH-48)", "lat": 13.0200, "lng": 77.5200, "ffs": 60.0},
    {"id": "seg-013", "road_name": "Bellary Road", "lat": 13.0100, "lng": 77.5750, "ffs": 50.0},
    {"id": "seg-014", "road_name": "Mysore Road", "lat": 12.9500, "lng": 77.5100, "ffs": 50.0},
    {"id": "seg-015", "road_name": "Kanakapura Road", "lat": 12.9000, "lng": 77.5550, "ffs": 45.0},
    {"id": "seg-016", "road_name": "Hebbal Flyover", "lat": 13.0358, "lng": 77.5970, "ffs": 55.0},
    {"id": "seg-017", "road_name": "KR Puram Bridge", "lat": 12.9996, "lng": 77.7041, "ffs": 40.0},
    {"id": "seg-018", "road_name": "Yeshwanthpur Circle", "lat": 13.0220, "lng": 77.5450, "ffs": 35.0},
    {"id": "seg-019", "road_name": "Jayanagar 4th Block", "lat": 12.9250, "lng": 77.5830, "ffs": 30.0},
    {"id": "seg-020", "road_name": "Sarjapur Road", "lat": 12.9100, "lng": 77.6850, "ffs": 40.0},
    {"id": "seg-021", "road_name": "Old Airport Road", "lat": 12.9600, "lng": 77.6500, "ffs": 45.0},
    {"id": "seg-022", "road_name": "Residency Road", "lat": 12.9700, "lng": 77.6000, "ffs": 30.0},
    {"id": "seg-023", "road_name": "Lavelle Road", "lat": 12.9680, "lng": 77.5950, "ffs": 25.0},
    {"id": "seg-024", "road_name": "NICE Road (Tumkur)", "lat": 13.0300, "lng": 77.4800, "ffs": 80.0},
    {"id": "seg-025", "road_name": "Yelahanka – Doddaballapur Road", "lat": 13.1000, "lng": 77.5800, "ffs": 55.0},
]


def _time_factor(hour: int) -> float:
    """
    Returns a multiplier 0–1 representing how congested Bangalore typically
    is at a given hour.  Peak: 8-10 AM, 5-8 PM.
    """
    if 8 <= hour <= 10:
        return 0.85 + random.uniform(0, 0.15)   # morning rush
    elif 17 <= hour <= 20:
        return 0.80 + random.uniform(0, 0.20)   # evening rush
    elif 12 <= hour <= 14:
        return 0.45 + random.uniform(0, 0.15)   # lunch
    elif 22 <= hour or hour <= 5:
        return 0.05 + random.uniform(0, 0.10)   # night
    else:
        return 0.30 + random.uniform(0, 0.20)   # normal


def _generate_mock_segments() -> List[TrafficSegment]:
    """Generate time-varying traffic data for all Bangalore segments."""
    now = datetime.now(tz=timezone.utc)
    hour = (now.hour + 5) % 24  # IST offset (UTC+5:30 approx)
    base_factor = _time_factor(hour)
    segments: List[TrafficSegment] = []

    for seg in BANGALORE_SEGMENTS:
        # Per-road jitter so each road feels different
        road_factor = base_factor * random.uniform(0.6, 1.4)
        road_factor = max(0.0, min(1.0, road_factor))

        ffs = seg["ffs"]
        current_speed = ffs * (1.0 - road_factor)
        current_speed = max(2.0, round(current_speed + random.uniform(-3, 3), 1))

        congestion = calculate_congestion(current_speed, ffs)
        level = get_congestion_level(congestion)
        delay = max(0.0, round((ffs - current_speed) / ffs * 600 + random.uniform(-30, 60), 0))

        segments.append(TrafficSegment(
            id=seg["id"],
            road_name=seg["road_name"],
            latitude=seg["lat"],
            longitude=seg["lng"],
            current_speed=round(current_speed, 1),
            free_flow_speed=ffs,
            congestion_ratio=round(congestion, 3),
            congestion_level=level,
            delay_seconds=delay,
            confidence=round(random.uniform(0.80, 0.99), 2),
            timestamp=now,
            source="demo",
        ))

    return segments


# ── Cache ──────────────────────────────────────────────────────────────────

_traffic_cache: TTLCache = TTLCache(maxsize=1, ttl=settings.TRAFFIC_CACHE_TTL)


class TrafficService:
    """Provides current traffic data from TomTom or demo mode."""

    def get_current_traffic(self) -> Tuple[List[dict], str]:
        """Returns (list-of-segment-dicts, data_mode)."""
        if settings.TOMTOM_API_KEY:
            return self._fetch_live_traffic()
        return self._get_demo_traffic()

    # -- demo -----------------------------------------------------------------

    def _get_demo_traffic(self) -> Tuple[List[dict], str]:
        cache_key = "demo_traffic"
        cached = _traffic_cache.get(cache_key)
        if cached is not None:
            return cached

        segments = _generate_mock_segments()
        result = [s.model_dump(mode="json") for s in segments]
        _traffic_cache[cache_key] = (result, "demo")
        return result, "demo"

    # -- live (TomTom) --------------------------------------------------------

    def _fetch_live_traffic(self) -> Tuple[List[dict], str]:
        """
        Placeholder for real TomTom Traffic Flow API integration.

        When TOMTOM_API_KEY is set this method will call:
        GET https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json
        and normalize the response into TrafficSegment models.
        """
        # TODO: implement real TomTom call with httpx
        return self._get_demo_traffic()
