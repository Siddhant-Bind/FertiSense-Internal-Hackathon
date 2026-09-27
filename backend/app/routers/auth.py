from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import UserSignup, UserLogin, TokenResponse
from app.db.supabase_client import supabase

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
            
        # Insert the extra info into public.users
        try:
            supabase.table("users").upsert({
                "id": user.id,
                "email_or_phone": user_data.email,
                "mobile_number": user_data.mobile_number,
                "state": user_data.state,
                "district": user_data.district
            }).execute()
        except Exception as insert_e:
            import logging
            logging.getLogger(__name__).error(f"Failed to insert public user: {insert_e}")

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
