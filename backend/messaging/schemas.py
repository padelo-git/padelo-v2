from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class MessageBase(BaseModel):
    club_id: int
    sender_id: int
    content: str
    message_type: str = "text"
    is_announcement: bool = False


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime


class MessageReadBase(BaseModel):
    message_id: int
    user_id: int


class MessageReadCreate(MessageReadBase):
    pass


class MessageReadResponse(MessageReadBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    read_at: datetime


class ConversationBase(BaseModel):
    club_id: int
    user_id: int


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(BaseModel):
    is_active: Optional[bool] = None


class ConversationResponse(ConversationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class MessageWithReads(MessageResponse):
    read_receipts: List[MessageReadResponse] = []
