from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import UserSignup, UserLogin, TokenResponse
from app.db.supabase_client import supabase, get_admin_client

router = APIRouter()

@router.post("/signup", response_model=TokenResponse)
def signup(user_data: UserSignup):
    try:
        # Sign up the user in Supabase auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })
        
        user = auth_response.user
        if not user:
            raise HTTPException(status_code=400, detail="Signup failed. User may already exist.")
            
        # Insert the extra info through a fresh service-role client. The shared
        # client can inherit the newly signed-in user's session, which makes
        # this write subject to RLS and previously caused a silent failure.
        try:
            profile_response = get_admin_client().table("users").upsert({
                "id": user.id,
                "full_name": user_data.name,
                "email_or_phone": user_data.email,
                "mobile_number": user_data.mobile_number,
                "state": user_data.state,
                "district": user_data.district
            }).execute()
            if not profile_response.data:
                raise RuntimeError("User profile was not saved.")
        except Exception as insert_e:
            import logging
            logging.getLogger(__name__).error(f"Failed to insert public user: {insert_e}")
            raise HTTPException(status_code=500, detail="Account created, but the user profile could not be saved. Please contact support.")

        return TokenResponse(
            access_token=auth_response.session.access_token if auth_response.session else "",
            token_type="bearer",
            user_id=str(user.id),
            message="Signup successful! Please check email to verify if email confirmation is enabled."
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password,
        })
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        return TokenResponse(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            user_id=str(auth_response.user.id),
            message="Login successful"
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

class UserProfile(BaseModel):
    id: str
    full_name: str | None = None
    email_or_phone: str | None = None
    mobile_number: str | None = None
    state: str | None = None
    district: str | None = None
    created_at: str | None = None

security = HTTPBearer()

@router.get("/me", response_model=UserProfile)
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        user_response = supabase.auth.get_user(credentials.credentials)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user_id = user_response.user.id
        # Read the profile through a fresh service-role client. The shared
        # client may hold an auth session and be constrained by users-table RLS.
        db_user = get_admin_client().table("users").select("*").eq("id", user_id).execute()
        
        if not db_user.data:
            return UserProfile(id=str(user_id), email_or_phone=user_response.user.email)
            
        u = db_user.data[0]
        return UserProfile(
            id=u.get("id"),
            full_name=u.get("full_name"),
            email_or_phone=u.get("email_or_phone"),
            mobile_number=u.get("mobile_number"),
            state=u.get("state"),
            district=u.get("district"),
            created_at=str(u["created_at"]) if u.get("created_at") else None,
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
