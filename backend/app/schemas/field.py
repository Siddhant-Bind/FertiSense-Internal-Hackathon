from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FieldCreate(BaseModel):
    field_name: Optional[str] = "Main Field"
    state_id: str
    district_id: int
    village_id: int
    soil_type_id: int
    land_size_acres: Optional[float] = None

class FieldResponse(BaseModel):
    id: int
    user_id: str
    field_name: str
    district_id: int
    village_id: int
    soil_type_id: int
    land_size_acres: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True