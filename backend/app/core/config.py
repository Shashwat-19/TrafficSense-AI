"""
TrafficSense AI — Application configuration.
"""

import logging
from pathlib import Path

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# backend/.env resolved from this file, so the lookup works from any working directory
_BACKEND_ENV = str(Path(__file__).resolve().parents[2] / ".env")


class Settings(BaseSettings):
    model_config = {
        "env_file": (".env", "backend/.env", "../backend/.env", _BACKEND_ENV),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }
    # ── API Keys ──────────────────────────────────────────────────────────
    TOMTOM_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""

    # ── App ────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_NAME: str = "TrafficSense AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True  # dev-only: forced to False when APP_ENV=production
    # ── CORS ──────────────────────────────────────────────────────────────
    # Accepts comma-separated origins string from .env (localhost default is dev-only)
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS into a list of strings."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # ── Bangalore defaults ────────────────────────────────────────────────
    DEFAULT_LAT: float = 12.9716  # dev-only: Bangalore fallback coordinates for weather lookups
    DEFAULT_LNG: float = 77.5946  # dev-only: Bangalore fallback coordinates for weather lookups

    # ── Congestion thresholds (configurable) ──────────────────────────────
    CONGESTION_LOW: float = 0.25
    CONGESTION_MODERATE: float = 0.50
    CONGESTION_HIGH: float = 0.75

    # ── Cache TTLs (seconds) ──────────────────────────────────────────────
    TRAFFIC_CACHE_TTL: int = 120       # 2 minutes
    WEATHER_CACHE_TTL: int = 300       # 5 minutes
    PREDICTION_CACHE_TTL: int = 300    # 5 minutes
    ANALYTICS_CACHE_TTL: int = 180     # 3 minutes

    # ── External API timeouts ─────────────────────────────────────────────
    API_TIMEOUT_SECONDS: int = 10

    # ── Chatbot / AWS Bedrock ─────────────────────────────────────────────
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    BEDROCK_MODEL_ID: str = "amazon.nova-lite-v1:0"
    CHATBOT_MAX_HISTORY: int = 20
    CHATBOT_REQUEST_TIMEOUT: int = 30

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Strip any accidental angle brackets or quotes
        if self.TOMTOM_API_KEY:
            self.TOMTOM_API_KEY = self.TOMTOM_API_KEY.strip("<> '\"")
        if self.OPENWEATHER_API_KEY:
            self.OPENWEATHER_API_KEY = self.OPENWEATHER_API_KEY.strip("<> '\"")
        if self.AWS_ACCESS_KEY_ID:
            self.AWS_ACCESS_KEY_ID = self.AWS_ACCESS_KEY_ID.strip("<> '\"")
        if self.AWS_SECRET_ACCESS_KEY:
            self.AWS_SECRET_ACCESS_KEY = self.AWS_SECRET_ACCESS_KEY.strip("<> '\"")
        if self.AWS_REGION:
            self.AWS_REGION = self.AWS_REGION.strip("<> '\"")

        # Production never serves debug behaviour, whatever DEBUG is set to
        if self.APP_ENV == "production":
            self.DEBUG = False


settings = Settings()

if not settings.TOMTOM_API_KEY:
    logger.warning("TOMTOM_API_KEY is not set; live traffic, incident and route data will fall back to demo mode")
