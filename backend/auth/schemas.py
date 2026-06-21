from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_club_admin: bool
    club_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class ClubBase(BaseModel):
    name: str
    slug: str
    email: EmailStr


class ClubCreate(ClubBase):
    password: str


class ClubLogin(BaseModel):
    email: EmailStr
    password: str


class ClubResponse(ClubBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
