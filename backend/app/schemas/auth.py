from pydantic import BaseModel, model_validator
from typing import Optional

class UserSignup(BaseModel):
    email: str
    mobile_number: str
    state: str
    district: str
    password: str
    confirm_password: str
    
    @model_validator(mode='after')
    def check_passwords_match(self) -> 'UserSignup':
        if self.password != self.confirm_password:
            raise ValueError('Passwords do not match')
        return self

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    message: str
