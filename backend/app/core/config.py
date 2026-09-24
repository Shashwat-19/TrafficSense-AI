"""
TrafficSense AI — Application configuration.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {
        "env_file": (".env", "backend/.env", "../backend/.env"),
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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Strip any accidental angle brackets or quotes
        if self.AWS_ACCESS_KEY_ID:
            self.AWS_ACCESS_KEY_ID = self.AWS_ACCESS_KEY_ID.strip("<> '\"")
        if self.AWS_SECRET_ACCESS_KEY:
            self.AWS_SECRET_ACCESS_KEY = self.AWS_SECRET_ACCESS_KEY.strip("<> '\"")
        if self.AWS_REGION:
            self.AWS_REGION = self.AWS_REGION.strip("<> '\"")

        # Auto-detect from aws.md if credentials not set in .env
        if not self.AWS_ACCESS_KEY_ID or not self.AWS_SECRET_ACCESS_KEY:
            self._load_from_aws_md()

    def _load_from_aws_md(self):
        import re
        from pathlib import Path

        candidates = [
            Path("aws.md"),
            Path("../aws.md"),
            Path(__file__).resolve().parent.parent.parent.parent / "aws.md",
            Path(__file__).resolve().parent.parent.parent / "aws.md",
        ]
        for p in candidates:
            if p.is_file():
                try:
                    content = p.read_text(encoding="utf-8")
                    key = re.search(r"AWS_ACCESS_KEY_ID\s*[=:]?\s*[<]?([A-Za-z0-9_+-]+)[>]?", content)
                    secret = re.search(r"AWS_SECRET_ACCESS_KEY\s*[=:]?\s*[<]?([A-Za-z0-9_+=/.-]+)[>]?", content)
                    region = re.search(r"AWS_REGION\s*[=:]?\s*[<]?([A-Za-z0-9_-]+)[>]?", content)
                    model = re.search(r"BEDROCK_MODEL_ID\s*[=:]?\s*[<]?([A-Za-z0-9_.:-]+)[>]?", content)
                    if key and not self.AWS_ACCESS_KEY_ID:
                        self.AWS_ACCESS_KEY_ID = key.group(1).strip()
                    if secret and not self.AWS_SECRET_ACCESS_KEY:
                        self.AWS_SECRET_ACCESS_KEY = secret.group(1).strip()
                    if region and (not self.AWS_REGION or self.AWS_REGION == "us-east-1"):
                        self.AWS_REGION = region.group(1).strip()
                    if model and not self.BEDROCK_MODEL_ID:
                        self.BEDROCK_MODEL_ID = model.group(1).strip()
                    if self.AWS_ACCESS_KEY_ID and self.AWS_SECRET_ACCESS_KEY:
                        break
                except Exception:
                    pass


settings = Settings()
