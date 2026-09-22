"""
TrafficSense AI — Weather service.

Integrates with OpenWeather API (live) or returns realistic
time-varying mock weather for Bangalore (demo mode).
"""

import random
from datetime import datetime, timezone
from typing import Tuple
from cachetools import TTLCache

from app.core.config import settings
from app.models.schemas import WeatherData


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
    hour = (now.hour + 5) % 24  # IST

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

_weather_cache: TTLCache = TTLCache(maxsize=1, ttl=settings.WEATHER_CACHE_TTL)


class WeatherService:
    """Provides weather data from OpenWeather or demo mode."""

    def get_weather(self) -> Tuple[dict, str]:
        """Returns (weather-dict, data_mode)."""
        if settings.OPENWEATHER_API_KEY:
            return self._fetch_live_weather()
        return self._get_demo_weather()

    def _get_demo_weather(self) -> Tuple[dict, str]:
        cache_key = "demo_weather"
        cached = _weather_cache.get(cache_key)
        if cached is not None:
            return cached

        weather = _generate_mock_weather()
        result = weather.model_dump(mode="json")
        _weather_cache[cache_key] = (result, "demo")
        return result, "demo"

    def _fetch_live_weather(self) -> Tuple[dict, str]:
        """
        Placeholder for OpenWeather API integration.

        When OPENWEATHER_API_KEY is set this method will call:
        GET https://api.openweathermap.org/data/2.5/weather?lat=12.9716&lon=77.5946&appid=KEY&units=metric
        """
        # TODO: implement real OpenWeather call with httpx
        return self._get_demo_weather()
