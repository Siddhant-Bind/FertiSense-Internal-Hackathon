from app.core.constants import SAFE_DOSAGE_LIMITS, DEFAULT_SAFE_DOSAGE_LIMIT
from app.db.supabase_client import supabase

def apply_dosage_clamp(
    field_id: int, 
    rec_fertilizer_id: int, 
    proposed_quantity: float
) -> tuple[float, str, str]:
    """
    Clamps the dosage to safe limits and checks cumulative season usage.
    Returns: (clamped_quantity, timing_override, explanation_override)
    If override is not needed, timing and explanation overrides are None.
    """
    limit = SAFE_DOSAGE_LIMITS.get(rec_fertilizer_id, DEFAULT_SAFE_DOSAGE_LIMIT)
    
    clamped_quantity = min(proposed_quantity, limit)
    
    # Check cumulative season usage
    # Since there's no season column, we'll just sum all for this field_id as a proxy.
    res = supabase.table("recommendations").select("rec_quantity").eq("field_id", field_id).eq("rec_fertilizer_id", rec_fertilizer_id).execute()
    
    cumulative = sum([row["rec_quantity"] for row in res.data]) if res.data else 0.0
    
    if cumulative + clamped_quantity > limit:
        # Override to reduce/avoid
        remaining_allowance = max(0.0, limit - cumulative)
        if remaining_allowance <= 0:
            return 0.0, "Avoid further application.", f"Cumulative limit of {limit} kg/acre for this fertilizer has been reached this season. Do not apply more."
        else:
            return remaining_allowance, "Apply remaining safe allowance.", f"Proposed quantity reduced. You can safely apply only {remaining_allowance} kg/acre more this season."
            
    return clamped_quantity, None, None
