from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.db.supabase_client import supabase

router = APIRouter()

@router.get("/districts")
def get_districts() -> List[Dict[str, Any]]:
    response = supabase.table("districts").select("id, district_name, state_name").execute()
    return response.data

@router.get("/districts/{district_id}/villages")
def get_villages_by_district(district_id: int) -> List[Dict[str, Any]]:
    response = supabase.table("villages").select("id, village_name, latitude, longitude").eq("district_id", district_id).execute()
    return response.data

@router.get("/crop-types")
def get_crop_types() -> List[Dict[str, Any]]:
    response = supabase.table("crop_types").select("id, crop_name").execute()
    return response.data

@router.get("/soil-types")
def get_soil_types() -> List[Dict[str, Any]]:
    response = supabase.table("soil_types").select("id, soil_name").execute()
    return response.data

@router.get("/fertilizer-types")
def get_fertilizer_types() -> List[Dict[str, Any]]:
    response = supabase.table("fertilizer_types").select("id, fertilizer_name").execute()
    return response.data
