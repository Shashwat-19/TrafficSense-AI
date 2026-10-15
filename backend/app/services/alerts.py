"""
TrafficSense AI — Alerts service.

Derives alerts from the real traffic segments and incidents served by
TrafficService / IncidentService. The returned data_mode is "live" only when
both sources are live; otherwise it is "demo".
"""

from datetime import datetime, timezone, timedelta
from typing import List, Tuple

from app.models.schemas import Alert, AlertType, AlertSeverity, CongestionLevel, IncidentSeverity
from app.services.incident import IncidentService
from app.services.traffic import TrafficService

ALERT_TTL = timedelta(hours=1)


def _build_alerts(segments: List[dict], incidents: List[dict]) -> List[Alert]:
    """One alert per HIGH/SEVERE congested segment and per HIGH/CRITICAL incident."""
    now = datetime.now(tz=timezone.utc)
    alerts: List[Alert] = []

    for seg in segments:
        level = seg["congestion_level"]
        if level not in (CongestionLevel.SEVERE.value, CongestionLevel.HIGH.value):
            continue
        severe = level == CongestionLevel.SEVERE.value
        delay_min = round(seg["delay_seconds"] / 60)
        alerts.append(Alert(
            id=f"alert-seg-{seg['id']}",
            type=AlertType.SEVERE_CONGESTION,
            severity=AlertSeverity.CRITICAL if severe else AlertSeverity.WARNING,
            title=f"{'Severe Congestion' if severe else 'Heavy Traffic'} – {seg['road_name']}",
            message=(
                f"Speed {seg['current_speed']} km/h against free-flow {seg['free_flow_speed']} km/h "
                f"({seg['congestion_ratio'] * 100:.0f}% congestion). Estimated delay about {delay_min} min."
            ),
            latitude=seg["latitude"],
            longitude=seg["longitude"],
            road_name=seg["road_name"],
            created_at=now,
            expires_at=now + ALERT_TTL,
        ))

    for inc in incidents:
        if inc["severity"] not in (IncidentSeverity.HIGH.value, IncidentSeverity.CRITICAL.value):
            continue
        critical = inc["severity"] == IncidentSeverity.CRITICAL.value
        alerts.append(Alert(
            id=f"alert-inc-{inc['id']}",
            type=AlertType.MAJOR_INCIDENT,
            severity=AlertSeverity.CRITICAL if critical else AlertSeverity.WARNING,
            title=f"{inc['type'].replace('_', ' ').title()} – {inc.get('road_name') or 'Bangalore'}",
            message=inc["description"],
            latitude=inc["latitude"],
            longitude=inc["longitude"],
            road_name=inc.get("road_name"),
            created_at=now,
            expires_at=now + ALERT_TTL,
        ))

    return alerts


class AlertsService:
    """Provides traffic alerts derived from live or demo traffic and incidents."""

    def __init__(self):
        self._traffic = TrafficService()
        self._incidents = IncidentService()

    def get_alerts(
        self,
        alert_type: str | None = None,
        severity: str | None = None,
    ) -> Tuple[List[dict], str]:
        # No cache here: the traffic and incident services already cache their results,
        # and caching alerts would keep demo fallbacks alive after a live recovery.
        segments, traffic_mode = self._traffic.get_current_traffic()
        incidents, incident_mode = self._incidents.get_incidents()
        mode = "live" if traffic_mode == "live" and incident_mode == "live" else "demo"

        result = [a.model_dump(mode="json") for a in _build_alerts(segments, incidents)]

        if alert_type:
            result = [a for a in result if a["type"] == alert_type.upper()]
        if severity:
            result = [a for a in result if a["severity"] == severity.upper()]

        return result, mode
