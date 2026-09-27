import json
import logging
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings


def _build_prompt(
    anchor_fertilizer: str, comparison_result: str, growth_stage: str,
    n: float, p: float, k: float, ph: float, temperature: float, humidity: float,
    moisture: float, prev_qty: float, rain_probability: Optional[float] = None,
    rain_amount: Optional[float] = None, wind_speed: Optional[float] = None,
    organic_carbon: Optional[float] = None,
    previous_report: Optional[Dict[str, Any]] = None,
) -> str:
    """Build a field-specific prompt. comparison_result is retained for API compatibility only."""
    prompt = f"""
You are an expert agronomist providing a field-specific fertilizer recommendation.

Your task is to recommend an appropriate fertilizer quantity, blend, and application timing using current soil conditions, crop growth stage, current and forecast weather, previous fertilizer application/history, and sustainable farming principles.

IMPORTANT:
- Do not mention MATCH, MISMATCH, or similar comparison labels.
- Analyze prior history only for information relevant to the current recommendation; do not invent information.
- Explain the practical relevance of rainfall, temperature, humidity, and wind only when relevant.
- Consider runoff/leaching with heavy or probable rainfall, avoid application immediately before significant rain, and consider wind for foliar/spray application.
- Promote nutrient-use efficiency, soil health, and avoiding unnecessary fertilizer and nutrient losses.
- Do not recommend a fertilizer solely due to weather; consider N/P/K, pH, crop stage, and prior application together.

FIELD INFORMATION
Anchor fertilizer: {anchor_fertilizer}
Crop growth stage: {growth_stage}

Soil Data:
- Nitrogen (N): {n}
- Phosphorus (P): {p}
- Potassium (K): {k}
- pH: {ph}
- Soil moisture: {moisture}%
"""
    if organic_carbon is not None:
        prompt += f"- Organic Carbon: {organic_carbon}%\n"
    prompt += f"""
Weather Data:
- Temperature: {temperature}°C
- Humidity: {humidity}%
"""
    if rain_probability is not None:
        prompt += f"- Rain probability: {rain_probability}%\n"
    if rain_amount is not None:
        prompt += f"- Expected rainfall: {rain_amount} mm\n"
    if wind_speed is not None:
        prompt += f"- Wind speed: {wind_speed} m/s\n"
    prompt += f"\nPrevious fertilizer quantity: {prev_qty} kg/acre\n"
    if previous_report:
        prompt += f"""
Previous Recommendation / Field History:
{json.dumps(previous_report, default=str)}

Extract only relevant fertilizer, quantity, timing, deficiency, observation, warning, or farmer-action information and explain its current impact naturally.
"""
    prompt += f"""
RECOMMENDATION REQUIREMENTS
Determine anchor suitability, kg/acre quantity, needed supplement, timing, weather impact, historical impact, and sustainable-farming impact. If information is insufficient to confidently determine quantity, state the limitation in warning rather than inventing facts.

Return ONLY valid JSON in exactly this structure:
{{
  "quantity": <float>, "unit": "kg/acre",
  "timing": {{"recommendation": "<when and how to apply>", "weather_relevance": "<relevant weather and timing impact>"}},
  "nutrient_assessment": {{"nitrogen": "<assessment>", "phosphorus": "<assessment>", "potassium": "<assessment>", "ph": "<assessment>"}},
  "previous_report_relevance": {{"relevant_information": "<relevant history or none>", "impact_on_current_recommendation": "<impact>"}},
  "weather_assessment": {{"relevant_parameters": ["<parameter>"], "impact": "<impact>"}},
  "sustainability": {{"nutrient_use_efficiency": "<assessment>", "nutrient_loss_reduction": "<assessment>", "soil_health": "<assessment>"}},
  "explanation": "<overall agronomic explanation>", "warning": "<string or null>",
  "blend": [
    {{"fertilizer_name": "{anchor_fertilizer}", "role": "anchor", "quantity_kg": <float>}},
    {{"fertilizer_name": "<one of: Urea, DAP, 28-28, 14-35-14, 20-20, 17-17-17, 10-26-26>", "role": "supplement", "quantity_kg": <float>}}
  ]
}}
FINAL RULES: Output only valid JSON, no markdown; do not mention MATCH or MISMATCH; do not blindly follow history; do not invent missing data.
"""
    return prompt


def _fallback(anchor_fertilizer: str, growth_stage: str) -> Dict[str, Any]:
    return {
        "quantity": 50.0, "unit": "kg/acre",
        "timing": {"recommendation": f"Apply {anchor_fertilizer} during {growth_stage}.", "weather_relevance": "Weather forecast was unavailable."},
        "nutrient_assessment": {},
        "previous_report_relevance": {"relevant_information": "No history assessment available.", "impact_on_current_recommendation": "None available."},
        "weather_assessment": {"relevant_parameters": [], "impact": "Weather forecast was unavailable."},
        "sustainability": {"nutrient_use_efficiency": "Use only the recommended amount.", "nutrient_loss_reduction": "Avoid application before heavy rain.", "soil_health": "Monitor soil health with regular testing."},
        "explanation": "Standard recommendation applied because the advisory service was unavailable.",
        "warning": "Verify the dose with a local agronomist before application.",
        "blend": [{"fertilizer_name": anchor_fertilizer, "role": "anchor", "quantity_kg": 50.0}],
    }


async def get_llm_recommendation(
    anchor_fertilizer: str, comparison_result: str, growth_stage: str,
    n: float, p: float, k: float, ph: float, temperature: float, humidity: float,
    moisture: float, prev_qty: float, organic_carbon: Optional[float] = None,
    previous_report: Optional[Dict[str, Any]] = None, rain_probability: Optional[float] = None,
    rain_amount: Optional[float] = None, wind_speed: Optional[float] = None,
) -> Dict[str, Any]:
    prompt = _build_prompt(anchor_fertilizer, comparison_result, growth_stage, n, p, k, ph,
                           temperature, humidity, moisture, prev_qty, rain_probability,
                           rain_amount, wind_speed, organic_carbon, previous_report)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    for attempt in range(2):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=10.0)
                response.raise_for_status()
            text_response = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            if text_response.startswith("```"):
                text_response = text_response.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            result = json.loads(text_response)
            result.setdefault("blend", [{"fertilizer_name": anchor_fertilizer, "role": "anchor", "quantity_kg": result.get("quantity", 50.0)}])
            if isinstance(result.get("timing"), str):
                result["timing"] = {"recommendation": result["timing"], "weather_relevance": ""}
            return result
        except Exception as exc:
            if attempt == 1:
                logging.getLogger(__name__).warning("LLM parsing failed after retry; using fallback: %s", exc)
    return _fallback(anchor_fertilizer, growth_stage)
