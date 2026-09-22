"""
TrafficSense AI — User service.

In-memory user preferences, saved locations, and recent routes for
development mode. Ready for Cognito / DynamoDB integration.
"""

from datetime import datetime
from typing import Tuple

from app.models.schemas import (
    UserPreferences,
    SavedLocation,
    RecentRoute,
    AlertType,
)


# ── In-memory store (per-process; replace with DynamoDB in prod) ───────────

_default_preferences = UserPreferences(
    notifications_enabled=True,
    default_map_center_lat=12.9716,
    default_map_center_lng=77.5946,
    default_map_zoom=13,
    preferred_units="metric",
    saved_locations=[
        SavedLocation(
            id="loc-001",
            name="Koramangala",
            latitude=12.9352,
            longitude=77.6245,
            label="Home",
        ),
        SavedLocation(
            id="loc-002",
            name="Electronic City Phase 1",
            latitude=12.8458,
            longitude=77.6602,
            label="Work",
        ),
        SavedLocation(
            id="loc-003",
            name="Indiranagar",
            latitude=12.9784,
            longitude=77.6408,
            label="Favorite",
        ),
    ],
    recent_routes=[
        RecentRoute(
            id="rr-001",
            origin_name="Koramangala",
            destination_name="Electronic City",
            origin_lat=12.9352,
            origin_lng=77.6245,
            destination_lat=12.8458,
            destination_lng=77.6602,
        ),
        RecentRoute(
            id="rr-002",
            origin_name="Indiranagar",
            destination_name="Whitefield",
            origin_lat=12.9784,
            origin_lng=77.6408,
            destination_lat=12.9698,
            destination_lng=77.7500,
        ),
    ],
    favorite_areas=["Koramangala", "Indiranagar", "MG Road"],
    alert_types=list(AlertType),
)

_user_prefs: UserPreferences = _default_preferences.model_copy()


class UserService:
    """User preferences and saved data (in-memory for dev)."""

    def get_preferences(self) -> Tuple[dict, str]:
        return _user_prefs.model_dump(mode="json"), "demo"

    def update_preferences(self, prefs: dict) -> Tuple[dict, str]:
        global _user_prefs
        current = _user_prefs.model_dump()
        current.update(prefs)
        _user_prefs = UserPreferences(**current)
        return _user_prefs.model_dump(mode="json"), "demo"
