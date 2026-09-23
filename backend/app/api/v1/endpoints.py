"""
TrafficSense AI — API v1 endpoints.

All routes are prefixed with /api/v1/ by the main app.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from typing import Optional

from app.models.schemas import AppResponse, RouteRequest
from app.services.traffic import TrafficService
from app.services.incident import IncidentService
from app.services.weather import WeatherService
from app.services.prediction import PredictionService
from app.services.route import RouteService
from app.services.analytics import AnalyticsService
from app.services.alerts import AlertsService
from app.services.user import UserService
from app.services.chatbot import ChatbotService
from app.models.schemas import ChatRequest, ChatResponse

router = APIRouter()

# ── Service singletons ────────────────────────────────────────────────────

traffic_service = TrafficService()
incident_service = IncidentService()
weather_service = WeatherService()
prediction_service = PredictionService()
route_service = RouteService()
analytics_service = AnalyticsService()
alerts_service = AlertsService()
user_service = UserService()
chatbot_service = ChatbotService()


# ── Health ─────────────────────────────────────────────────────────────────

@router.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "version": "1.0.0",
    }


# ── Traffic ────────────────────────────────────────────────────────────────

@router.get("/traffic/current", response_model=AppResponse, tags=["Traffic"])
async def get_current_traffic():
    """Get current traffic data for all monitored Bangalore segments."""
    data, mode = traffic_service.get_current_traffic()
    return AppResponse(data=data, data_mode=mode, source="traffic")


@router.get("/traffic/incidents", response_model=AppResponse, tags=["Traffic"])
async def get_incidents(
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MODERATE, HIGH, CRITICAL"),
    type: Optional[str] = Query(None, alias="incident_type", description="Filter by type: ACCIDENT, ROAD_CLOSURE, etc."),
):
    """Get current traffic incidents."""
    data, mode = incident_service.get_incidents(severity=severity, incident_type=type)
    return AppResponse(data=data, data_mode=mode, source="incidents")


# ── Weather ────────────────────────────────────────────────────────────────

@router.get("/weather", response_model=AppResponse, tags=["Weather"])
async def get_weather():
    """Get current weather data for Bangalore."""
    data, mode = weather_service.get_weather()
    return AppResponse(data=data, data_mode=mode, source="weather")


# ── Predictions ────────────────────────────────────────────────────────────

@router.get("/predictions", response_model=AppResponse, tags=["Predictions"])
async def get_predictions(
    segment_id: Optional[str] = Query(None, description="Specific segment ID"),
    horizon: int = Query(15, description="Prediction horizon in minutes: 15, 30, or 60"),
):
    """Get traffic predictions for segments."""
    if horizon not in (15, 30, 60):
        raise HTTPException(status_code=400, detail="Horizon must be 15, 30, or 60 minutes")
    data, mode = prediction_service.get_predictions(segment_id=segment_id, horizon=horizon)
    return AppResponse(data=data, data_mode=mode, source="predictions")


# ── Routes ─────────────────────────────────────────────────────────────────

@router.post("/routes", response_model=AppResponse, tags=["Routes"])
async def get_routes(req: RouteRequest):
    """Calculate route alternatives between origin and destination."""
    data, mode = route_service.get_routes(req)
    return AppResponse(data=data, data_mode=mode, source="routes")


# ── Analytics ──────────────────────────────────────────────────────────────

@router.get("/analytics", response_model=AppResponse, tags=["Analytics"])
async def get_analytics():
    """Get aggregated traffic analytics."""
    data, mode = analytics_service.get_analytics()
    return AppResponse(data=data, data_mode=mode, source="analytics")


# ── Alerts ─────────────────────────────────────────────────────────────────

@router.get("/alerts", response_model=AppResponse, tags=["Alerts"])
async def get_alerts(
    type: Optional[str] = Query(None, alias="alert_type", description="Filter by alert type"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
):
    """Get active traffic alerts."""
    data, mode = alerts_service.get_alerts(alert_type=type, severity=severity)
    return AppResponse(data=data, data_mode=mode, source="alerts")


# ── Users ──────────────────────────────────────────────────────────────────

@router.get("/users/preferences", response_model=AppResponse, tags=["Users"])
async def get_user_preferences():
    """Get user preferences (dev mode: in-memory)."""
    data, mode = user_service.get_preferences()
    return AppResponse(data=data, data_mode=mode, source="users")


@router.put("/users/preferences", response_model=AppResponse, tags=["Users"])
async def update_user_preferences(prefs: dict):
    """Update user preferences."""
    data, mode = user_service.update_preferences(prefs)
    return AppResponse(data=data, data_mode=mode, source="users")


# ── Chat ───────────────────────────────────────────────────────────────────

@router.post(
    "/chat",
    response_model=ChatResponse,
    tags=["Chat"],
    summary="Send a message to TrafficSense AI chatbot",
    description=(
        "Send a natural-language message and receive an AI-powered response. "
        "The chatbot can access live traffic data, predictions, incidents, "
        "weather, routes, and analytics through integrated tools."
    ),
    responses={
        200: {
            "description": "Successful chat response",
            "content": {
                "application/json": {
                    "example": {
                        "response": "Traffic on Outer Ring Road is currently ...",
                        "conversation_id": "abc123",
                        "sources": ["get_current_traffic"],
                        "tools_used": ["get_current_traffic"],
                        "actions": [{"type": "FOCUS_MAP", "latitude": 12.9537, "longitude": 77.7012, "zoom": 14}],
                        "timestamp": "2025-01-01T12:00:00Z",
                    }
                }
            },
        },
        400: {"description": "Invalid request"},
        500: {"description": "Internal server error"},
    },
)
async def chat(req: ChatRequest):
    """Chat with TrafficSense AI."""
    result = await chatbot_service.chat(
        message=req.message,
        conversation_id=req.conversation_id,
    )
    return ChatResponse(**result)


@router.delete(
    "/chat/{conversation_id}",
    tags=["Chat"],
    summary="Clear a chat conversation",
)
async def clear_chat(conversation_id: str):
    """Clear conversation history for a given ID."""
    cleared = chatbot_service.clear_conversation(conversation_id)
    return {
        "cleared": cleared,
        "conversation_id": conversation_id,
    }
