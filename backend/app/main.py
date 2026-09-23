"""
TrafficSense AI — FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.endpoints import router as api_v1_router
from app.core.config import settings
from app.core.middleware import log_requests


app = FastAPI(
    title="TrafficSense AI",
    description=(
        "Cloud-Based Intelligent Traffic Monitoring, Prediction, "
        "Route Analysis and Conversational Assistance Platform — "
        "focused on Bangalore, India."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ─────────────────────────────────────────────────────────────

app.add_middleware(BaseHTTPMiddleware, dispatch=log_requests)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────────────────

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/", tags=["System"])
def root():
    """Root endpoint — API info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "docs": "/docs",
        "api_base": "/api/v1",
        "endpoints": {
            "traffic": "/api/v1/traffic/current",
            "incidents": "/api/v1/traffic/incidents",
            "weather": "/api/v1/weather",
            "predictions": "/api/v1/predictions",
            "routes": "/api/v1/routes",
            "analytics": "/api/v1/analytics",
            "alerts": "/api/v1/alerts",
            "user_preferences": "/api/v1/users/preferences",
            "health": "/api/v1/health",
        },
    }
