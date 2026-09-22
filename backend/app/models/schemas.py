"""
TrafficSense AI — Pydantic schemas for all data models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime, timezone
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────

class CongestionLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    SEVERE = "SEVERE"


class IncidentType(str, Enum):
    ACCIDENT = "ACCIDENT"
    ROAD_CLOSURE = "ROAD_CLOSURE"
    CONSTRUCTION = "CONSTRUCTION"
    CONGESTION = "CONGESTION"
    OBSTRUCTION = "OBSTRUCTION"
    OTHER = "OTHER"


class IncidentSeverity(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertType(str, Enum):
    SEVERE_CONGESTION = "SEVERE_CONGESTION"
    MAJOR_INCIDENT = "MAJOR_INCIDENT"
    ROUTE_DELAY = "ROUTE_DELAY"
    TRAFFIC_INCREASE = "TRAFFIC_INCREASE"
    WEATHER_RISK = "WEATHER_RISK"


class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


# ── Traffic ────────────────────────────────────────────────────────────────

class TrafficSegment(BaseModel):
    id: str
    road_name: str
    latitude: float
    longitude: float
    current_speed: float = Field(ge=0, description="Current speed in km/h")
    free_flow_speed: float = Field(gt=0, description="Free-flow speed in km/h")
    congestion_ratio: float = Field(ge=0, le=1, description="0 = free flow, 1 = standstill")
    congestion_level: CongestionLevel
    delay_seconds: float = Field(ge=0)
    confidence: float = Field(ge=0, le=1)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    source: str = "mock"


# ── Incidents ──────────────────────────────────────────────────────────────

class Incident(BaseModel):
    id: str
    type: IncidentType
    severity: IncidentSeverity
    latitude: float
    longitude: float
    description: str
    road_name: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    source: str = "mock"


# ── Weather ────────────────────────────────────────────────────────────────

class WeatherData(BaseModel):
    temperature: float = Field(description="Temperature in °C")
    feels_like: Optional[float] = None
    condition: str
    description: str = ""
    icon: str = "01d"
    humidity: float = Field(ge=0, le=100, description="Humidity %")
    wind_speed: float = Field(ge=0, description="Wind speed in m/s")
    wind_direction: Optional[float] = None
    visibility: float = Field(ge=0, description="Visibility in meters")
    precipitation: float = Field(ge=0, description="Precipitation in mm")
    pressure: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    source: str = "mock"


# ── Predictions ────────────────────────────────────────────────────────────

class TrafficPrediction(BaseModel):
    segment_id: str
    road_name: str = ""
    horizon_minutes: int = Field(description="Prediction horizon: 15, 30, or 60")
    predicted_speed: float = Field(ge=0)
    predicted_congestion: float = Field(ge=0, le=1)
    predicted_level: CongestionLevel
    confidence: float = Field(ge=0, le=1)
    current_speed: Optional[float] = None
    current_congestion: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


# ── Routes ─────────────────────────────────────────────────────────────────

class RoutePoint(BaseModel):
    latitude: float
    longitude: float


class RouteAlternative(BaseModel):
    id: str
    name: str
    distance_km: float = Field(ge=0)
    travel_time_seconds: int = Field(ge=0)
    delay_seconds: int = Field(ge=0)
    congestion_level: CongestionLevel
    congestion_ratio: float = Field(ge=0, le=1)
    points: List[RoutePoint] = []
    summary: str = ""


class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    departure_time: Optional[datetime] = None
    avoid_congestion: bool = False
    avoid_incidents: bool = False


class RouteResponse(BaseModel):
    origin: RoutePoint
    destination: RoutePoint
    alternatives: List[RouteAlternative] = []


# ── Analytics ──────────────────────────────────────────────────────────────

class CongestionDistribution(BaseModel):
    level: CongestionLevel
    count: int
    percentage: float


class HourlyPattern(BaseModel):
    hour: int
    avg_speed: float
    avg_congestion: float
    segment_count: int


class TopCongestedRoad(BaseModel):
    road_name: str
    congestion_ratio: float
    congestion_level: CongestionLevel
    current_speed: float
    free_flow_speed: float


class IncidentStats(BaseModel):
    type: str
    count: int


class AnalyticsData(BaseModel):
    overall_congestion: float
    overall_level: CongestionLevel
    avg_speed: float
    total_segments: int
    total_incidents: int
    congestion_distribution: List[CongestionDistribution] = []
    hourly_patterns: List[HourlyPattern] = []
    top_congested_roads: List[TopCongestedRoad] = []
    incident_stats: List[IncidentStats] = []
    speed_vs_freeflow: List[dict] = []


# ── Alerts ─────────────────────────────────────────────────────────────────

class Alert(BaseModel):
    id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    road_name: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    expires_at: Optional[datetime] = None


# ── User ───────────────────────────────────────────────────────────────────

class SavedLocation(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    label: str = ""  # e.g., "Home", "Work"


class RecentRoute(BaseModel):
    id: str
    origin_name: str
    destination_name: str
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    searched_at: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class UserPreferences(BaseModel):
    notifications_enabled: bool = True
    default_map_center_lat: float = 12.9716
    default_map_center_lng: float = 77.5946
    default_map_zoom: int = 13
    preferred_units: str = "metric"
    saved_locations: List[SavedLocation] = []
    recent_routes: List[RecentRoute] = []
    favorite_areas: List[str] = []
    alert_types: List[AlertType] = list(AlertType)


# ── API Response Wrapper ───────────────────────────────────────────────────

class AppResponse(BaseModel):
    data: Any
    data_mode: str = Field(description="'live' or 'demo'")
    last_updated: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))
    source: str = ""
