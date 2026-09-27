import json
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

def _build_prompt(
    anchor_fertilizer: str,
    comparison_result: str,
    growth_stage: str,
    n: float, p: float, k: float, ph: float,
    temperature: float, humidity: float, moisture: float,
    prev_qty: float,
    organic_carbon: Optional[float] = None,
    previous_report: Optional[Dict[str, Any]] = None
) -> str:
    prompt = f"""
You are an expert agronomist. 
We have selected '{anchor_fertilizer}' as the anchor fertilizer for the '{growth_stage}' stage.
The farmer previously used a fertilizer, and comparing it to the new recommendation, the result is: {comparison_result}.
Soil Data: N={n}, P={p}, K={k}, pH={ph}, Moisture={moisture}%
Weather: Temp={temperature}C, Humidity={humidity}%
"""
    if organic_carbon is not None:
        prompt += f"Organic Carbon: {organic_carbon}%\n"

    if previous_report:
        prompt += f"\nNote: This is a continuation of a previous recommendation for this field. Previous context: {json.dumps(previous_report, default=str)}\n"
        prompt += "Please ensure this new recommendation builds appropriately on the previous actions taken by the farmer.\n"

    prompt += f"""
Please provide the following in strict JSON format:
{{
  "quantity": <float, recommended kg/acre of the anchor fertilizer>,
  "unit": "kg/acre",
  "timing": "<string, when and how to apply>",
  "explanation": "<string, agronomist explanation of why this fertilizer and blend is needed based on soil/weather/stage. Mention the comparison result (MATCH/MISMATCH) if relevant.>",
  "warning": "<string or null, any safety warnings>",
  "blend": [
    {{
      "fertilizer_name": "{anchor_fertilizer}",
      "role": "anchor",
      "quantity_kg": <float>
    }},
    {{
      "fertilizer_name": "<string, must be one of: Urea, DAP, 28-28, 14-35-14, 20-20, 17-17-17, 10-26-26>",
      "role": "supplement",
      "quantity_kg": <float>
    }}
  ]
}}
Ensure the response is ONLY valid JSON.
"""
    return prompt

async def get_llm_recommendation(
    anchor_fertilizer: str,
    comparison_result: str,
    growth_stage: str,
    n: float, p: float, k: float, ph: float,
    temperature: float, humidity: float, moisture: float,
    prev_qty: float,
    organic_carbon: Optional[float] = None,
    previous_report: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    
    prompt = _build_prompt(
        anchor_fertilizer, comparison_result, growth_stage,
        n, p, k, ph, temperature, humidity, moisture,
        prev_qty, organic_carbon, previous_report
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    # Retry logic (1 retry)
    for attempt in range(2):
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, timeout=10.0)
                res.raise_for_status()
                data = res.json()
                
                text_response = data["candidates"][0]["content"]["parts"][0]["text"]
                # Clean up markdown JSON block if present
                text_response = text_response.strip()
                if text_response.startswith("```json"):
                    text_response = text_response[7:-3]
                elif text_response.startswith("```"):
                    text_response = text_response[3:-3]
                
                parsed_json = json.loads(text_response)
                
                # Ensure blend is present and valid
                if "blend" not in parsed_json:
                    parsed_json["blend"] = [{
                        "fertilizer_name": anchor_fertilizer,
                        "role": "anchor",
                        "quantity_kg": parsed_json.get("quantity", 50.0)
                    }]
                
                return parsed_json
        except Exception as e:
            if attempt == 1:
                import logging
                logging.getLogger(__name__).warning("LLM parsing failed after retry, using fallback. Error: %s", e)
                # Fallback on failure
                return {
                    "quantity": 50.0,
                    "unit": "kg/acre",
                    "timing": f"Apply {anchor_fertilizer} during {growth_stage}.",
                    "explanation": "Standard recommendation applied due to system timeout.",
                    "warning": None,
                    "blend": [{
                        "fertilizer_name": anchor_fertilizer,
                        "role": "anchor",
                        "quantity_kg": 50.0
                    }]
                }
