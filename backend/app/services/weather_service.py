import httpx
from typing import Optional, Tuple
from app.core.config import settings
from app.core.constants import WEATHER_FALLBACK_TEMP, WEATHER_FALLBACK_HUMIDITY

async def get_weather(lat: float, lon: float) -> Tuple[float, float, Optional[float], Optional[float], Optional[float]]:
    """
    Fetches weather data from OpenWeatherMap using latitude and longitude.
    Returns temperature, humidity, rain probability, expected rain amount, and wind speed.
    Falls back to constants on timeout or failure.
    """
    if not settings.WEATHER_API_KEY:
        return WEATHER_FALLBACK_TEMP, WEATHER_FALLBACK_HUMIDITY, None, None, None

    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={settings.WEATHER_API_KEY}&units=metric"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            # The first forecast period is the nearest available forecast.
            forecast = data["list"][0]
            temp = float(forecast["main"]["temp"])
            humidity = float(forecast["main"]["humidity"])
            rain_probability = float(forecast.get("pop", 0)) * 100
            rain = forecast.get("rain", {})
            rain_amount = float(rain.get("3h", rain.get("1h", 0)))
            wind = forecast.get("wind", {}).get("speed")
            wind_speed = float(wind) if wind is not None else None
            return temp, humidity, rain_probability, rain_amount, wind_speed
    except (httpx.RequestError, httpx.HTTPStatusError, KeyError, ValueError, IndexError) as e:
        import logging
        logging.getLogger(__name__).warning("Weather fetch failed, using fallback values. Error: %s", e)
        # On any error or timeout, return fallback values
        return WEATHER_FALLBACK_TEMP, WEATHER_FALLBACK_HUMIDITY, None, None, None
