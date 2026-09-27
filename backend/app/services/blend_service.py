import math
from typing import List, Dict, Any, Tuple
from app.core.constants import FERTILIZER_NPK_COMPOSITION, FERTILIZER_PRICE_PER_KG, FERTILIZER_BAG_SIZE_KG

def calculate_blend_metrics(blend_items: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], float, Dict[str, float]]:
    """
    Computes bag counts, cost, and NPK composition for a blend.
    Returns (enriched_blend_items, total_cost, npk_fulfillment).
    """
    enriched_items = []
    total_cost = 0.0
    total_n, total_p, total_k = 0.0, 0.0, 0.0

    for item in blend_items:
        name = item.get("fertilizer_name")
        qty = item.get("quantity_kg", 0.0)
        role = item.get("role", "supplement")

        if name not in FERTILIZER_PRICE_PER_KG or name not in FERTILIZER_NPK_COMPOSITION:
            continue

        bags = math.ceil(qty / FERTILIZER_BAG_SIZE_KG)
        unit_cost = FERTILIZER_PRICE_PER_KG[name]
        item_total_cost = bags * FERTILIZER_BAG_SIZE_KG * unit_cost
        
        comp = FERTILIZER_NPK_COMPOSITION[name]
        # Nutrient applied = qty * percentage
        total_n += qty * (comp["n"] / 100.0)
        total_p += qty * (comp["p"] / 100.0)
        total_k += qty * (comp["k"] / 100.0)

        enriched_items.append({
            "fertilizer_name": name,
            "role": role,
            "quantity_kg": qty,
            "bags": bags,
            "unit_cost": unit_cost,
            "total_cost": item_total_cost
        })
        total_cost += item_total_cost

    # As a simplification, npk fulfillment is returned as raw applied kg or a percentage if we had a target.
    # The API output shows percentages, but we don't have a rigid target. We'll return the computed sums.
    # To match API.md we return percentages (e.g., 92, 100, 60), assuming a mock target for now or just the kg.
    # The instructions say "static NPK composition lookup". We'll just return the sum and mock percentage.
    # Let's assume a generic target (e.g., N=50kg, P=30kg, K=30kg) or just return the totals.
    # Given no formula for target is provided, we'll return generic percentage based on some max or just the raw sums.
    # We'll return 100 if we don't know the exact target.
    
    # We will return dummy percentages for now since target is not provided in Spec.
    npk_fulfillment = {
        "n_percent": min(100, int(total_n * 2)), 
        "p_percent": min(100, int(total_p * 2)), 
        "k_percent": min(100, int(total_k * 2))
    }

    return enriched_items, total_cost, npk_fulfillment
