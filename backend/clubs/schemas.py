from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime


class ClubBase(BaseModel):
    name: str
    slug: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "Argentina"
    description: Optional[str] = None
    logo_url: Optional[str] = None


class ClubCreate(ClubBase):
    password: str


class ClubUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    # Configuration fields
    currency: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    court_count: Optional[int] = None
    # Pricing fields
    hourly_price: Optional[float] = None
    premium_hourly_price: Optional[float] = None
    lesson_1_player_price: Optional[float] = None
    lesson_2_player_price: Optional[float] = None
    lesson_3_player_price: Optional[float] = None
    lesson_4_player_price: Optional[float] = None
    # Operating hours
    operating_hours_start: Optional[str] = None
    operating_hours_end: Optional[str] = None
    # Tax and Stripe fields
    tax_id: Optional[str] = None
    tax_id_type: Optional[str] = None
    stripe_public_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None


class ClubResponse(ClubBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    trial_start_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    grace_period_end_date: Optional[datetime] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    country: Optional[str] = None
    court_count: Optional[int] = None
    hourly_price: Optional[float] = None
    premium_hourly_price: Optional[float] = None
    lesson_1_player_price: Optional[float] = None
    lesson_2_player_price: Optional[float] = None
    lesson_3_player_price: Optional[float] = None
    lesson_4_player_price: Optional[float] = None
    operating_hours_start: Optional[str] = None
    operating_hours_end: Optional[str] = None
    tax_id: Optional[str] = None
    tax_id_type: Optional[str] = None
    stripe_public_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None


class CourtBase(BaseModel):
    name: str
    number: int
    surface: str = "Césped"
    is_indoor: bool = False


class CourtCreate(CourtBase):
    club_id: int


class CourtUpdate(BaseModel):
    name: Optional[str] = None
    number: Optional[int] = None
    surface: Optional[str] = None
    is_indoor: Optional[bool] = None
    is_active: Optional[bool] = None


class CourtResponse(CourtBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    club_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class ReservationBase(BaseModel):
    club_id: int
    court_id: int
    date: datetime
    start_time: str
    end_time: str
    price: Optional[int] = None
    notes: Optional[str] = None


class ReservationCreate(ReservationBase):
    user_id: int


class ReservationUpdate(BaseModel):
    status: Optional[str] = None
    price: Optional[int] = None
    notes: Optional[str] = None


class ReservationResponse(ReservationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class ClubWithCourts(ClubResponse):
    courts: List[CourtResponse] = []
