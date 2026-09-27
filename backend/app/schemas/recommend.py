from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class RecommendRequest(BaseModel):
    state_id: str
    district_id: int
    village_id: int
    crop_type_id: int
    soil_type_id: int
    growth_stage: str
    moisture: float
    is_continuation: bool = False
    sowing_date: Optional[str] = None
    prev_fertilizer_id: Optional[int] = None
    prev_fertilizer_qty: Optional[float] = 0.0
    manual_n: Optional[float] = None
    manual_p: Optional[float] = None
    manual_k: Optional[float] = None
    manual_ph: Optional[float] = None
    organic_carbon: Optional[float] = None
    field_id: Optional[int] = None # Added so we can query history

class BlendItem(BaseModel):
    fertilizer_name: str
    role: str
    quantity_kg: float
    bags: int
    unit_cost: float
    total_cost: float

class NpkFulfillment(BaseModel):
    n_percent: int
    p_percent: int
    k_percent: int

class RecommendResponse(BaseModel):
    recommendation_id: int
    rec_fertilizer: str
    rec_quantity: float
    rec_unit: str = "kg/acre"
    application_timing: str
    explanation: str
    comparison_result: str
    blend: List[BlendItem]
    blend_total_cost: float
    npk_fulfillment: NpkFulfillment
