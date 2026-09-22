"""
TrafficSense AI — Route service.

Provides route planning with alternatives, mock Bangalore routes for
demo mode, and a provider abstraction for TomTom / HERE / Mapbox.
"""

import random
from datetime import datetime
from typing import Tuple

from app.core.config import settings
from app.models.schemas import (
    RouteAlternative,
    RoutePoint,
    RouteRequest,
    RouteResponse,
    CongestionLevel,
)
from app.services.traffic import calculate_congestion, get_congestion_level


# ── Bangalore landmark coordinates ────────────────────────────────────────

LANDMARKS = {
    "majestic": (12.9767, 77.5713),
    "mg_road": (12.9757, 77.6062),
    "koramangala": (12.9352, 77.6245),
    "indiranagar": (12.9784, 77.6408),
    "whitefield": (12.9698, 77.7500),
    "electronic_city": (12.8458, 77.6602),
    "hebbal": (13.0358, 77.5970),
    "silk_board": (12.9177, 77.6238),
    "marathahalli": (12.9537, 77.7012),
    "jayanagar": (12.9250, 77.5830),
    "yeshwanthpur": (13.0220, 77.5450),
    "kr_puram": (12.9996, 77.7041),
    "bannerghatta": (12.8880, 77.5972),
    "airport": (13.1986, 77.7066),
}


def _interpolate_points(
    origin: RoutePoint, dest: RoutePoint, num: int = 8
) -> list[RoutePoint]:
    """Generate intermediate waypoints between origin and destination."""
    points = [origin]
    for i in range(1, num):
        frac = i / num
        lat = origin.latitude + (dest.latitude - origin.latitude) * frac
        lng = origin.longitude + (dest.longitude - origin.longitude) * frac
        # Add slight randomness to simulate real roads
        lat += random.uniform(-0.005, 0.005)
        lng += random.uniform(-0.005, 0.005)
        points.append(RoutePoint(latitude=round(lat, 6), longitude=round(lng, 6)))
    points.append(dest)
    return points


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Approximate distance in km."""
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class RouteService:
    """Route planning with provider abstraction."""

    def get_routes(self, req: RouteRequest) -> Tuple[dict, str]:
        """Return route alternatives."""
        if settings.TOMTOM_API_KEY:
            return self._fetch_live_routes(req)
        return self._get_demo_routes(req)

    def _get_demo_routes(self, req: RouteRequest) -> Tuple[dict, str]:
        origin = RoutePoint(latitude=req.origin_lat, longitude=req.origin_lng)
        dest = RoutePoint(latitude=req.destination_lat, longitude=req.destination_lng)
        dist = _haversine_km(req.origin_lat, req.origin_lng, req.destination_lat, req.destination_lng)

        # Generate 2-3 alternative routes with varying congestion
        alternatives = []
        route_names = ["Via Outer Ring Road", "Via MG Road / Inner Ring", "Via Hosur Road"]
        for i in range(min(3, max(2, int(dist / 5)))):
            multiplier = 1.0 + i * 0.15 + random.uniform(-0.05, 0.1)
            route_dist = round(dist * multiplier, 1)

            # Speed varies per route
            avg_speed = random.uniform(15, 45)
            travel_time = int(route_dist / avg_speed * 3600)
            free_flow_time = int(route_dist / 50 * 3600)
            delay = max(0, travel_time - free_flow_time)
            congestion = calculate_congestion(avg_speed, 50)
            level = get_congestion_level(congestion)

            # If user wants to avoid congestion, sort better routes first
            points = _interpolate_points(origin, dest, num=random.randint(6, 12))

            alternatives.append(RouteAlternative(
                id=f"route-{i+1}",
                name=route_names[i] if i < len(route_names) else f"Alternative {i+1}",
                distance_km=route_dist,
                travel_time_seconds=travel_time,
                delay_seconds=delay,
                congestion_level=level,
                congestion_ratio=round(congestion, 3),
                points=points,
                summary=f"{route_dist} km • {travel_time // 60} min",
            ))

        # Sort by travel time (fastest first)
        if req.avoid_congestion:
            alternatives.sort(key=lambda r: r.congestion_ratio)
        else:
            alternatives.sort(key=lambda r: r.travel_time_seconds)

        response = RouteResponse(
            origin=origin,
            destination=dest,
            alternatives=alternatives,
        )

        return response.model_dump(mode="json"), "demo"

    def _fetch_live_routes(self, req: RouteRequest) -> Tuple[dict, str]:
        """
        Placeholder for TomTom Routing API integration.

        When TOMTOM_API_KEY is set this method will call:
        GET https://api.tomtom.com/routing/1/calculateRoute/{origin}:{dest}/json
        """
        # TODO: implement real TomTom routing
        return self._get_demo_routes(req)
