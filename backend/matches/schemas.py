from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from matches.models import MatchStatus, InvitationStatus, Gender


class MatchBase(BaseModel):
    club_id: int
    court_id: int
    date: datetime
    start_time: str
    end_time: str
    category: Optional[str] = None
    gender: Gender = Gender.MIXED
    price: Optional[int] = None


class MatchCreate(MatchBase):
    created_by: int


class MatchUpdate(BaseModel):
    status: Optional[MatchStatus] = None
    price: Optional[int] = None


class MatchResponse(MatchBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    status: MatchStatus
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class MatchInvitationBase(BaseModel):
    match_id: int
    user_id: int
    position: int


class MatchInvitationCreate(MatchInvitationBase):
    pass


class MatchInvitationUpdate(BaseModel):
    status: Optional[InvitationStatus] = None


class MatchInvitationResponse(MatchInvitationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    status: InvitationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None


class MatchRequestBase(BaseModel):
    club_id: int
    date: datetime
    preferred_time: Optional[str] = None
    category: Optional[str] = None
    gender: Gender = Gender.MIXED


class MatchRequestCreate(MatchRequestBase):
    user_id: int


class MatchRequestUpdate(BaseModel):
    status: Optional[str] = None


class MatchRequestResponse(MatchRequestBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class MatchWithInvitations(MatchResponse):
    invitations: List[MatchInvitationResponse] = []
