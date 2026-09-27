from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.db.supabase_client import supabase

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Extracts the Bearer token, verifies it with Supabase, and returns the user_id.
    """
    token = credentials.credentials
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return user_response.user.id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)) -> Optional[str]:
    """
    Extracts the user_id if token is present, else returns None.
    """
    if not credentials:
        return None
    try:
        user_response = supabase.auth.get_user(credentials.credentials)
        if user_response and user_response.user:
            return user_response.user.id
    except Exception:
        pass
    return None