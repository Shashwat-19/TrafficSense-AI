"""
TrafficSense AI — Analytics service.

Aggregates current traffic data into analytics: congestion distribution,
hourly patterns, top congested roads, speed comparisons, incident stats.
"""

import random
from datetime import datetime
from typing import Tuple
from cachetools import TTLCache

from app.core.config import settings
from app.models.schemas import (
    AnalyticsData,
    CongestionDistribution,
    CongestionLevel,
    HourlyPattern,
    IncidentStats,
    TopCongestedRoad,
)
from app.services.traffic import (
    TrafficService,
    calculate_congestion,
    get_congestion_level,
    _time_factor,
    BANGALORE_SEGMENTS,
)


_analytics_cache: TTLCache = TTLCache(maxsize=1, ttl=settings.ANALYTICS_CACHE_TTL)


class AnalyticsService:
    """Aggregates traffic data into analytics views."""

    def __init__(self):
        self._traffic = TrafficService()

    def get_analytics(self) -> Tuple[dict, str]:
        cache_key = "analytics"
        cached = _analytics_cache.get(cache_key)
        if cached is not None:
            return cached

        result = self._compute_analytics()
        _analytics_cache[cache_key] = (result, "demo")
        return result, "demo"

    def _compute_analytics(self) -> dict:
        segments_data, _ = self._traffic.get_current_traffic()

        # ── Overall metrics ────────────────────────────────────────────
        total = len(segments_data)
        if total == 0:
            empty = AnalyticsData(
                overall_congestion=0, overall_level=CongestionLevel.LOW,
                avg_speed=0, total_segments=0, total_incidents=0,
            )
            return empty.model_dump(mode="json")

        speeds = [s["current_speed"] for s in segments_data]
        congestions = [s["congestion_ratio"] for s in segments_data]
        avg_speed = sum(speeds) / total
        avg_congestion = sum(congestions) / total
        overall_level = get_congestion_level(avg_congestion)

        # ── Congestion distribution ────────────────────────────────────
        counts = {level: 0 for level in CongestionLevel}
        for s in segments_data:
            level = CongestionLevel(s["congestion_level"])
            counts[level] += 1

        distribution = [
            CongestionDistribution(
                level=level,
                count=count,
                percentage=round(count / total * 100, 1),
            )
            for level, count in counts.items()
        ]

        # ── Top congested roads ────────────────────────────────────────
        sorted_segs = sorted(segments_data, key=lambda s: s["congestion_ratio"], reverse=True)
        top_congested = [
            TopCongestedRoad(
                road_name=s["road_name"],
                congestion_ratio=s["congestion_ratio"],
                congestion_level=CongestionLevel(s["congestion_level"]),
                current_speed=s["current_speed"],
                free_flow_speed=s["free_flow_speed"],
            )
            for s in sorted_segs[:10]
        ]

        # ── Hourly patterns (synthetic but realistic) ──────────────────
        hourly_patterns = []
        for hour in range(24):
            factor = _time_factor(hour)
            h_speed = 50 * (1 - factor * 0.8) + random.uniform(-2, 2)
            hourly_patterns.append(HourlyPattern(
                hour=hour,
                avg_speed=round(max(5, h_speed), 1),
                avg_congestion=round(factor, 3),
                segment_count=total,
            ))

        # ── Speed vs free-flow comparison ──────────────────────────────
        speed_vs_freeflow = [
            {
                "road_name": s["road_name"],
                "current_speed": s["current_speed"],
                "free_flow_speed": s["free_flow_speed"],
            }
            for s in sorted_segs[:12]
        ]

        # ── Incident stats (from incident templates) ──────────────────
        from app.services.incident import IncidentService
        inc_svc = IncidentService()
        incidents, _ = inc_svc.get_incidents()
        inc_type_counts: dict[str, int] = {}
        for inc in incidents:
            t = inc["type"]
            inc_type_counts[t] = inc_type_counts.get(t, 0) + 1

        incident_stats = [
            IncidentStats(type=t, count=c)
            for t, c in inc_type_counts.items()
        ]

        analytics = AnalyticsData(
            overall_congestion=round(avg_congestion, 3),
            overall_level=overall_level,
            avg_speed=round(avg_speed, 1),
            total_segments=total,
            total_incidents=len(incidents),
            congestion_distribution=distribution,
            hourly_patterns=hourly_patterns,
            top_congested_roads=top_congested,
            incident_stats=incident_stats,
            speed_vs_freeflow=speed_vs_freeflow,
        )

        return analytics.model_dump(mode="json")
