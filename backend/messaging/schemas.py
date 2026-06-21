from pydantic import BaseModel
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
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class MessageReadBase(BaseModel):
    message_id: int
    user_id: int


class MessageReadCreate(MessageReadBase):
    pass


class MessageReadResponse(MessageReadBase):
    id: int
    read_at: datetime
    
    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    club_id: int
    user_id: int


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(BaseModel):
    is_active: Optional[bool] = None


class ConversationResponse(ConversationBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MessageWithReads(MessageResponse):
    read_receipts: List[MessageReadResponse] = []
