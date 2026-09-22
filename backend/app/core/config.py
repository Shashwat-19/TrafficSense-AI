"""
TrafficSense AI — Application configuration.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
    # ── API Keys ──────────────────────────────────────────────────────────
    TOMTOM_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""

    # ── App ────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_NAME: str = "TrafficSense AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── CORS ──────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # ── Bangalore defaults ────────────────────────────────────────────────
    DEFAULT_LAT: float = 12.9716
    DEFAULT_LNG: float = 77.5946
    DEFAULT_RADIUS_KM: float = 15.0

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
    API_MAX_RETRIES: int = 3





settings = Settings()
