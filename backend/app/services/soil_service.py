from typing import Optional, Tuple, Dict
from app.db.supabase_client import supabase

def resolve_soil_data(
    district_id: int,
    village_id: int,
    manual_n: Optional[float] = None,
    manual_p: Optional[float] = None,
    manual_k: Optional[float] = None,
    manual_ph: Optional[float] = None,
) -> Dict[str, float]:
    """
    Resolves soil N/P/K/pH values using manual overrides, village data, or district fallbacks.
    Returns a dict with 'n', 'p', 'k', 'ph', 'latitude', 'longitude'.
    """
    # Fetch village data
    village_res = supabase.table("villages").select("*").eq("id", village_id).execute()
    village_data = village_res.data[0] if village_res.data else None

    # Fetch district fallback data
    district_res = supabase.table("districts").select("default_n, default_p, default_k, default_ph").eq("id", district_id).execute()
    district_data = district_res.data[0] if district_res.data else {"default_n": 0.0, "default_p": 0.0, "default_k": 0.0, "default_ph": 7.0}

    def _resolve(nutrient: str, manual_val: Optional[float], default_key: str) -> float:
        if manual_val is not None:
            return manual_val
        if village_data and village_data.get(nutrient) is not None:
            return float(village_data[nutrient])
        return float(district_data[default_key])

    n = _resolve("n", manual_n, "default_n")
    p = _resolve("p", manual_p, "default_p")
    k = _resolve("k", manual_k, "default_k")
    ph = _resolve("ph", manual_ph, "default_ph")
    
    lat = float(village_data["latitude"]) if village_data and village_data.get("latitude") else 0.0
    lon = float(village_data["longitude"]) if village_data and village_data.get("longitude") else 0.0

    return {
        "n": n,
        "p": p,
        "k": k,
        "ph": ph,
        "latitude": lat,
        "longitude": lon
    }
