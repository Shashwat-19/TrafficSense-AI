"""
TrafficSense AI — Chatbot tool definitions.

Defines tools the LLM can invoke via the Bedrock Converse API,
each backed by existing TrafficSense services.
"""

import logging
from typing import Any

from app.models.schemas import RouteRequest
from app.services.traffic import TrafficService
from app.services.incident import IncidentService
from app.services.weather import WeatherService
from app.services.prediction import PredictionService
from app.services.route import RouteService
from app.services.analytics import AnalyticsService
from app.services.alerts import AlertsService

logger = logging.getLogger("trafficsense.chatbot.tools")

# ── Service singletons ────────────────────────────────────────────────────

_traffic_service = TrafficService()
_incident_service = IncidentService()
_weather_service = WeatherService()
_prediction_service = PredictionService()
_route_service = RouteService()
_analytics_service = AnalyticsService()
_alerts_service = AlertsService()


# ── Tool schemas for Bedrock Converse API ──────────────────────────────────

TOOL_CONFIG = {
    "tools": [
        {
            "toolSpec": {
                "name": "get_current_traffic",
                "description": (
                    "Get current real-time traffic data for Bangalore road segments. "
                    "Returns speed, congestion level, and delay for each road. "
                    "Use when user asks about current traffic conditions."
                ),
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "road_name": {
                                "type": "string",
                                "description": "Optional road name to filter (e.g. 'Outer Ring Road', 'Silk Board', 'MG Road'). Leave empty for all roads.",
                            }
                        },
                        "required": [],
                    }
                },
            }
        },
        {
            "toolSpec": {
                "name": "get_traffic_incidents",
                "description": (
                    "Get current traffic incidents in Bangalore: accidents, road closures, "
                    "construction, congestion events, obstructions. Use when user asks about "
                    "incidents, accidents, or road closures."
                ),
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "severity": {
                                "type": "string",
                                "description": "Filter by severity: LOW, MODERATE, HIGH, CRITICAL",
                                "enum": ["LOW", "MODERATE", "HIGH", "CRITICAL"],
                            }
                        },
                        "required": [],
                    }
                },
            }
        },
        {
            "toolSpec": {
                "name": "get_weather",
                "description": (
                    "Get current weather conditions for Bangalore: temperature, humidity, "
                    "rain, wind, visibility. Use when user asks about weather or its impact on traffic."
                ),
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {},
                        "required": [],
                    }
                },
            }
        },
        {
            "toolSpec": {
                "name": "get_traffic_prediction",
                "description": (
                    "Predict future traffic conditions using ML models. "
                    "Available horizons: 15, 30, or 60 minutes into the future. "
                    "Use when user asks what traffic will be like later."
                ),
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "horizon_minutes": {
                                "type": "integer",
                                "description": "Prediction horizon: 15, 30, or 60 minutes",
                                "enum": [15, 30, 60],
                            },
                            "road_name": {
                                "type": "string",
                                "description": "Optional road name to filter predictions for",
                            },
                        },
                        "required": [],
                    }
                },
            }
        },
        {
            "toolSpec": {
                "name": "find_route",
                "description": (
                    "Find routes between two locations in Bangalore with alternatives. "
                    "Returns distance, travel time, congestion level for each route. "
                    "Use when user asks for route planning or directions."
                ),
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "origin": {
                                "type": "string",
                                "description": "Origin location name (e.g. 'Koramangala', 'Whitefield', 'MG Road')",
                            },
                            "destination": {
                                "type": "string",
                                "description": "Destination location name",
                            },
                            "avoid_congestion": {
                                "type": "boolean",
                                "description": "Whether to prefer routes that avoid congestion",
                            },
                        },
                        "required": ["origin", "destination"],
                    }
                },
            }
        },
        {
            "toolSpec": {
                "name": "get_traffic_analytics",
                "description": (
                    "Get aggregated traffic analytics: overall congestion level, average speed, "
                    "top congested roads, congestion distribution, hourly patterns. "
                    "Use when user asks for traffic summary, trends, or overview."
                ),
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {},
                        "required": [],
                    }
                },
            }
        },
        {
            "toolSpec": {
                "name": "get_alerts",
                "description": (
                    "Get active traffic alerts: severe congestion, major incidents, "
                    "weather risks, route delays. Use when user asks about alerts or warnings."
                ),
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "severity": {
                                "type": "string",
                                "description": "Filter by severity: INFO, WARNING, CRITICAL",
                                "enum": ["INFO", "WARNING", "CRITICAL"],
                            }
                        },
                        "required": [],
                    }
                },
            }
        },
    ]
}


# ── Bangalore landmarks for route resolution ───────────────────────────────

LANDMARKS = {
    "majestic": (12.9767, 77.5713),
    "mg road": (12.9757, 77.6062),
    "koramangala": (12.9352, 77.6245),
    "indiranagar": (12.9784, 77.6408),
    "whitefield": (12.9698, 77.7500),
    "electronic city": (12.8458, 77.6602),
    "hebbal": (13.0358, 77.5970),
    "silk board": (12.9177, 77.6238),
    "marathahalli": (12.9537, 77.7012),
    "jayanagar": (12.9250, 77.5830),
    "yeshwanthpur": (13.0220, 77.5450),
    "kr puram": (12.9996, 77.7041),
    "bannerghatta": (12.8880, 77.5972),
    "airport": (13.1986, 77.7066),
    "hsr layout": (12.9116, 77.6474),
    "btm layout": (12.9166, 77.6101),
    "jp nagar": (12.9063, 77.5857),
    "rajajinagar": (12.9900, 77.5550),
    "malleshwaram": (13.0035, 77.5710),
    "yelahanka": (13.1005, 77.5963),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "orr": (12.9537, 77.7012),
    "outer ring road": (12.9537, 77.7012),
}


def _resolve_location(name: str) -> tuple[float, float]:
    """Resolve a location name to (lat, lng) using landmarks."""
    name_lower = name.lower().strip()
    for key, coords in LANDMARKS.items():
        if key in name_lower or name_lower in key:
            return coords
    # Default to Bangalore center
    return (12.9716, 77.5946)


# ── Tool execution ─────────────────────────────────────────────────────────

def execute_tool(tool_name: str, tool_input: dict[str, Any]) -> tuple[str, list[dict]]:
    """
    Execute a chatbot tool and return (result_text, actions).

    Parameters
    ----------
    tool_name  : name of the tool to execute
    tool_input : arguments from the LLM

    Returns
    -------
    tuple of (formatted result string for LLM, list of UI action dicts)
    """
    logger.info("Executing tool: %s with input: %s", tool_name, tool_input)
    actions: list[dict] = []

    try:
        if tool_name == "get_current_traffic":
            return _exec_get_current_traffic(tool_input, actions)

        elif tool_name == "get_traffic_incidents":
            return _exec_get_incidents(tool_input, actions)

        elif tool_name == "get_weather":
            return _exec_get_weather(tool_input, actions)

        elif tool_name == "get_traffic_prediction":
            return _exec_get_prediction(tool_input, actions)

        elif tool_name == "find_route":
            return _exec_find_route(tool_input, actions)

        elif tool_name == "get_traffic_analytics":
            return _exec_get_analytics(tool_input, actions)

        elif tool_name == "get_alerts":
            return _exec_get_alerts(tool_input, actions)

        else:
            return f"Unknown tool: {tool_name}", actions

    except Exception as e:
        logger.error("Tool execution error for %s: %s", tool_name, e, exc_info=True)
        return f"Error executing {tool_name}: {str(e)}", actions


# ── Individual tool implementations ────────────────────────────────────────

def _exec_get_current_traffic(
    tool_input: dict, actions: list[dict]
) -> tuple[str, list[dict]]:
    data, mode = _traffic_service.get_current_traffic()
    road_filter = tool_input.get("road_name", "").lower()

    if road_filter:
        data = [
            s for s in data
            if road_filter in s["road_name"].lower()
        ]
        if data and len(data) > 0:
            seg = data[0]
            actions.append({
                "type": "FOCUS_MAP",
                "latitude": seg["latitude"],
                "longitude": seg["longitude"],
                "zoom": 14,
            })

    if not data:
        return "No traffic data found for the specified road.", actions

    lines = [f"Traffic data ({mode} mode, {len(data)} segments):"]
    for seg in data[:10]:
        lines.append(
            f"- {seg['road_name']}: {seg['current_speed']} km/h "
            f"(free-flow: {seg['free_flow_speed']} km/h), "
            f"congestion: {seg['congestion_level']}, "
            f"delay: {seg['delay_seconds']:.0f}s"
        )
    if len(data) > 10:
        lines.append(f"... and {len(data) - 10} more segments.")

    return "\n".join(lines), actions


def _exec_get_incidents(
    tool_input: dict, actions: list[dict]
) -> tuple[str, list[dict]]:
    severity = tool_input.get("severity")
    data, mode = _incident_service.get_incidents(
        severity=severity, incident_type=None
    )

    if not data:
        return "No active incidents found.", actions

    actions.append({"type": "SHOW_INCIDENTS"})

    lines = [f"Active incidents ({len(data)}):"]
    for inc in data:
        lines.append(
            f"- [{inc['severity']}] {inc['type']} on {inc.get('road_name', 'Unknown road')}: "
            f"{inc['description']}"
        )

    return "\n".join(lines), actions


def _exec_get_weather(
    tool_input: dict, actions: list[dict]
) -> tuple[str, list[dict]]:
    data, mode = _weather_service.get_weather()
    result = (
        f"Current Bangalore weather ({mode} mode):\n"
        f"- Temperature: {data['temperature']}°C (feels like {data.get('feels_like', data['temperature'])}°C)\n"
        f"- Condition: {data['condition']} — {data.get('description', '')}\n"
        f"- Humidity: {data['humidity']}%\n"
        f"- Wind: {data['wind_speed']} m/s\n"
        f"- Visibility: {data['visibility']}m\n"
        f"- Precipitation: {data['precipitation']} mm"
    )
    return result, actions


def _exec_get_prediction(
    tool_input: dict, actions: list[dict]
) -> tuple[str, list[dict]]:
    horizon = tool_input.get("horizon_minutes", 30)
    if horizon not in (15, 30, 60):
        horizon = 30

    road_name = tool_input.get("road_name", "").lower()
    segment_id = None

    if road_name:
        from app.services.traffic import BANGALORE_SEGMENTS
        for seg in BANGALORE_SEGMENTS:
            if road_name in seg["road_name"].lower():
                segment_id = seg["id"]
                break

    data, mode = _prediction_service.get_predictions(
        segment_id=segment_id, horizon=horizon
    )

    if not data:
        return "No prediction data available.", actions

    lines = [f"Traffic predictions ({horizon} min ahead, {mode}):"]
    for pred in data[:10]:
        lines.append(
            f"- {pred['road_name']}: predicted speed {pred['predicted_speed']} km/h, "
            f"congestion: {pred['predicted_level']}, "
            f"confidence: {pred['confidence']:.0%}"
        )
    if len(data) > 10:
        lines.append(f"... and {len(data) - 10} more segments.")

    actions.append({"type": "SHOW_PREDICTION"})
    return "\n".join(lines), actions


def _exec_find_route(
    tool_input: dict, actions: list[dict]
) -> tuple[str, list[dict]]:
    origin_name = tool_input.get("origin", "Bangalore")
    dest_name = tool_input.get("destination", "Bangalore")
    avoid = tool_input.get("avoid_congestion", False)

    origin_coords = _resolve_location(origin_name)
    dest_coords = _resolve_location(dest_name)

    req = RouteRequest(
        origin_lat=origin_coords[0],
        origin_lng=origin_coords[1],
        destination_lat=dest_coords[0],
        destination_lng=dest_coords[1],
        avoid_congestion=avoid,
    )

    data, mode = _route_service.get_routes(req)
    alternatives = data.get("alternatives", [])

    if not alternatives:
        return "No routes found.", actions

    actions.append({"type": "SHOW_ROUTE", "data": data})

    lines = [f"Routes from {origin_name} to {dest_name}:"]
    for alt in alternatives:
        mins = alt["travel_time_seconds"] // 60
        lines.append(
            f"- {alt['name']}: {alt['distance_km']} km, "
            f"{mins} min, congestion: {alt['congestion_level']}, "
            f"delay: {alt['delay_seconds'] // 60} min"
        )

    return "\n".join(lines), actions


def _exec_get_analytics(
    tool_input: dict, actions: list[dict]
) -> tuple[str, list[dict]]:
    data, mode = _analytics_service.get_analytics()

    top_roads = data.get("top_congested_roads", [])[:5]
    top_lines = []
    for r in top_roads:
        top_lines.append(
            f"  - {r['road_name']}: {r['current_speed']} km/h, "
            f"congestion: {r['congestion_level']}"
        )

    result = (
        f"Bangalore Traffic Analytics ({mode} mode):\n"
        f"- Overall congestion: {data['overall_level']} "
        f"({data['overall_congestion']:.0%})\n"
        f"- Average speed: {data['avg_speed']:.1f} km/h\n"
        f"- Monitored segments: {data['total_segments']}\n"
        f"- Active incidents: {data['total_incidents']}\n"
        f"- Top congested roads:\n" + "\n".join(top_lines)
    )

    actions.append({"type": "SHOW_ANALYTICS"})
    return result, actions


def _exec_get_alerts(
    tool_input: dict, actions: list[dict]
) -> tuple[str, list[dict]]:
    severity = tool_input.get("severity")
    data, mode = _alerts_service.get_alerts(
        alert_type=None, severity=severity
    )

    if not data:
        return "No active alerts.", actions

    lines = [f"Active alerts ({len(data)}):"]
    for alert in data:
        lines.append(
            f"- [{alert['severity']}] {alert['title']}: {alert['message']}"
        )

    return "\n".join(lines), actions
