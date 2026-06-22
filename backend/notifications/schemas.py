from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class NotificationBase(BaseModel):
    user_id: int
    title: str
    body: str
    notification_type: str
    data: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime


class DeviceTokenBase(BaseModel):
    user_id: int
    token: str
    platform: str


class DeviceTokenCreate(DeviceTokenBase):
    pass


class DeviceTokenUpdate(BaseModel):
    is_active: Optional[bool] = None


class DeviceTokenResponse(DeviceTokenBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
