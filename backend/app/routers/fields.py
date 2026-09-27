from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.field import FieldCreate, FieldResponse
from app.core.security import get_current_user
from app.db.supabase_client import supabase, get_admin_client

router = APIRouter()

@router.post("/", response_model=FieldResponse)
def create_field(field_data: FieldCreate, user_id: str = Depends(get_current_user)):
    """Creates a new field profile tied to the logged-in user."""
    # Validate village_id belongs to district_id
    village_response = supabase.table("villages").select("district_id").eq("id", field_data.village_id).execute()
    if not village_response.data or village_response.data[0]["district_id"] != field_data.district_id:
        raise HTTPException(status_code=400, detail="Mismatched village/district")
        
    insert_data = field_data.model_dump()
    insert_data["user_id"] = user_id
    
    admin_client = get_admin_client()
    # [Hackathon Fix]: Supabase usually requires a DB trigger to copy auth.users -> public.users.
    # To prevent FK crashes if the trigger is missing, we auto-upsert the user ID here safely.
    try:
        admin_client.table("users").upsert({"id": user_id}).execute()
    except Exception:
        pass
    
    response = admin_client.table("fields").insert(insert_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create field")
        
    return response.data[0]

@router.get("/", response_model=List[FieldResponse])
def get_fields(user_id: str = Depends(get_current_user)):
    """Retrieves all fields belonging to the authenticated user."""
    response = supabase.table("fields").select("*").eq("user_id", user_id).execute()
    return response.data