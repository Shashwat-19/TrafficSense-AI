"""
TrafficSense AI — Weather service.

Integrates with OpenWeather API (live) or returns realistic
time-varying mock weather for Bangalore (demo mode).
"""

import logging
import random
from datetime import datetime, timezone
from typing import Tuple
from cachetools import TTLCache

from app.core.config import settings
from app.models.schemas import WeatherData
from app.services.traffic import FALLBACK_CACHE_TTL, cache_get, cache_set, ist_hour

logger = logging.getLogger(__name__)

OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


# ── Bangalore weather patterns ─────────────────────────────────────────────

_WEATHER_CONDITIONS = [
    {"condition": "Clear", "description": "Clear sky", "icon": "01d"},
    {"condition": "Clouds", "description": "Partly cloudy", "icon": "02d"},
    {"condition": "Clouds", "description": "Scattered clouds", "icon": "03d"},
    {"condition": "Clouds", "description": "Overcast clouds", "icon": "04d"},
    {"condition": "Rain", "description": "Light rain", "icon": "10d"},
    {"condition": "Rain", "description": "Moderate rain", "icon": "09d"},
    {"condition": "Thunderstorm", "description": "Thunderstorm", "icon": "11d"},
    {"condition": "Mist", "description": "Mist", "icon": "50d"},
]


def _generate_mock_weather() -> WeatherData:
    """Generate realistic Bangalore weather based on time of day."""
    now = datetime.now(tz=timezone.utc)
    hour = ist_hour(now)

    # Bangalore temperature ranges: 18-35°C
    if 6 <= hour <= 10:
        base_temp = random.uniform(20, 25)
        cond_idx = random.choice([0, 1, 7])  # clear/cloudy/mist
    elif 11 <= hour <= 16:
        base_temp = random.uniform(28, 35)
        cond_idx = random.choice([0, 1, 2, 3])  # mostly clear
    elif 17 <= hour <= 20:
        base_temp = random.uniform(24, 30)
        cond_idx = random.choice([2, 3, 4, 5, 6])  # afternoon rain common
    else:
        base_temp = random.uniform(18, 22)
        cond_idx = random.choice([0, 1, 7])

    weather = _WEATHER_CONDITIONS[cond_idx]
    is_rainy = weather["condition"] in ("Rain", "Thunderstorm")

    return WeatherData(
        temperature=round(base_temp, 1),
        feels_like=round(base_temp + random.uniform(-2, 3), 1),
        condition=weather["condition"],
        description=weather["description"],
        icon=weather["icon"],
        humidity=round(random.uniform(55, 90) if is_rainy else random.uniform(40, 70), 0),
        wind_speed=round(random.uniform(1, 8) if not is_rainy else random.uniform(5, 18), 1),
        wind_direction=round(random.uniform(0, 360), 0),
        visibility=round(random.uniform(2000, 5000) if is_rainy else random.uniform(8000, 10000), 0),
        precipitation=round(random.uniform(1, 15), 1) if is_rainy else 0.0,
        pressure=round(random.uniform(1008, 1018), 0),
        timestamp=now,
        source="demo",
    )


# ── Cache ──────────────────────────────────────────────────────────────────

_weather_cache: TTLCache = TTLCache(maxsize=2, ttl=settings.WEATHER_CACHE_TTL)  # demo and live keys
_weather_fallback_cache: TTLCache = TTLCache(maxsize=1, ttl=FALLBACK_CACHE_TTL)  # demo data after a live failure


def _parse_openweather(data: dict, now: datetime) -> WeatherData:
    """Map an OpenWeather /data/2.5/weather payload (units=metric) to WeatherData."""
    weather = (data.get("weather") or [{}])[0]
    main = data.get("main") or {}
    wind = data.get("wind") or {}
    rain = data.get("rain") or {}
    return WeatherData(
        temperature=float(main["temp"]),
        feels_like=main.get("feels_like"),
        condition=weather.get("main", "Clear"),
        description=weather.get("description", ""),
        icon=weather.get("icon", "01d"),
        humidity=float(main.get("humidity", 0)),
        wind_speed=float(wind.get("speed", 0)),
        wind_direction=wind.get("deg"),
        visibility=float(data.get("visibility", 10000)),
        precipitation=float(rain.get("1h", 0.0)),
        pressure=main.get("pressure"),
        timestamp=now,
        source="live",
    )


class WeatherService:
    """Provides weather data from OpenWeather or demo mode."""

    def get_weather(self) -> Tuple[dict, str]:
        """Returns (weather-dict, data_mode)."""
        if settings.OPENWEATHER_API_KEY:
            return self._fetch_live_weather()
        return self._get_demo_weather()

    def _get_demo_weather(self) -> Tuple[dict, str]:
        cache_key = "demo_weather"
        cached = cache_get(_weather_cache, cache_key)
        if cached is not None:
            return cached

        weather = _generate_mock_weather()
        result = weather.model_dump(mode="json")
        cache_set(_weather_cache, cache_key, (result, "demo"))
        return result, "demo"

    def _fetch_live_weather(self) -> Tuple[dict, str]:
        """Live OpenWeather call for Bangalore; falls back to demo weather on any error."""
        cache_key = "live_weather"
        cached = cache_get(_weather_cache, cache_key)
        if cached is not None:
            return cached
        cached = cache_get(_weather_fallback_cache, cache_key)
        if cached is not None:
            return cached

        import httpx

        now = datetime.now(tz=timezone.utc)
        params = {
            "lat": settings.DEFAULT_LAT,
            "lon": settings.DEFAULT_LNG,
            "appid": settings.OPENWEATHER_API_KEY,
            "units": "metric",
        }
        try:
            with httpx.Client(timeout=settings.API_TIMEOUT_SECONDS) as client:
                resp = client.get(OPENWEATHER_URL, params=params)
            if resp.status_code == 200:
                weather = _parse_openweather(resp.json(), now)
                result = (weather.model_dump(mode="json"), "live")
                cache_set(_weather_cache, cache_key, result)
                return result
            # Status only: the request URL carries the API key and must not be logged
            logger.warning("OpenWeather live call returned HTTP %s; using demo weather.", resp.status_code)
        except Exception as e:
            logger.warning("OpenWeather live call failed (%s); using demo weather.", type(e).__name__)

        fallback = self._get_demo_weather()
        cache_set(_weather_fallback_cache, cache_key, fallback)
        return fallback
