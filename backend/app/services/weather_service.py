import httpx
from typing import Tuple
from app.core.config import settings
from app.core.constants import WEATHER_FALLBACK_TEMP, WEATHER_FALLBACK_HUMIDITY

async def get_weather(lat: float, lon: float) -> Tuple[float, float]:
    """
    Fetches weather data from OpenWeatherMap using latitude and longitude.
    Returns (temperature_celsius, humidity_percentage).
    Falls back to constants on timeout or failure.
    """
    if not settings.WEATHER_API_KEY:
        return WEATHER_FALLBACK_TEMP, WEATHER_FALLBACK_HUMIDITY

    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={settings.WEATHER_API_KEY}&units=metric"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            # The 2.5 forecast endpoint returns a 'list' of forecasts; we take the first one (most current)
            temp = float(data["list"][0]["main"]["temp"])
            humidity = float(data["list"][0]["main"]["humidity"])
            return temp, humidity
    except (httpx.RequestError, httpx.HTTPStatusError, KeyError, ValueError, IndexError) as e:
        import logging
        logging.getLogger(__name__).warning("Weather fetch failed, using fallback values. Error: %s", e)
        # On any error or timeout, return fallback values
        return WEATHER_FALLBACK_TEMP, WEATHER_FALLBACK_HUMIDITY
