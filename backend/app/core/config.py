"""
TrafficSense AI — Application configuration.
"""

from pydantic_settings import BaseSettings


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
    # Accepts comma-separated origins string from .env
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS into a list of strings."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

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

    # ── Chatbot / AWS Bedrock ─────────────────────────────────────────────
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    BEDROCK_MODEL_ID: str = "amazon.nova-lite-v1:0"
    CHATBOT_MAX_HISTORY: int = 20
    CHATBOT_REQUEST_TIMEOUT: int = 30


settings = Settings()
