from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.core.security import get_current_user
from app.db.supabase_client import supabase

router = APIRouter()

@router.get("/")
def get_user_recommendations(user_id: str = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """
    Retrieves all recommendations across all fields for the authenticated user, most recent first.
    """
    response = supabase.table("recommendations").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return response.data

@router.get("/{field_id}")
def get_field_recommendations(field_id: int, user_id: str = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """
    Retrieves past recommendations for a specific field, most recent first.
    """
    # Note: RLS ensures users can only view recommendations where auth.uid() = user_id
    # But just in case, we query with field_id.
    response = supabase.table("recommendations").select("*").eq("field_id", field_id).order("created_at", desc=True).execute()
    return response.data
