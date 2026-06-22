from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from core.database import get_db
from core.security import get_current_user
from notifications.models import Notification, DeviceToken
from notifications.schemas import (
    NotificationCreate, NotificationUpdate, NotificationResponse,
    DeviceTokenCreate, DeviceTokenUpdate, DeviceTokenResponse
)
from notifications.firebase_service import FirebaseService

router = APIRouter()


# Notification endpoints
@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new notification (requires authentication)"""
    db_notification = Notification(
        user_id=notification.user_id,
        title=notification.title,
        body=notification.body,
        notification_type=notification.notification_type,
        data=notification.data
    )
    db.add(db_notification)
    await db.commit()
    await db.refresh(db_notification)
    
    # Send push notification via Firebase
    await FirebaseService.send_push_notification_to_user(
        user_id=notification.user_id,
        title=notification.title,
        body=notification.body,
        data=notification.data,
        db_session=db
    )
    
    return db_notification


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(user_id: int, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Get all notifications for a user"""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    notifications = result.scalars().all()
    return notifications


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(notification_id: int, db: AsyncSession = Depends(get_db)):
    """Get notification by ID"""
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return notification


@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int, 
    notification_update: NotificationUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update notification (mark as read) (requires authentication)"""
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Update fields
    for field, value in notification_update.model_dump(exclude_unset=True).items():
        setattr(notification, field, value)
    
    # If marking as read, set read_at
    if notification_update.is_read:
        from datetime import datetime
        notification.read_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(notification)
    
    return notification


# Device Token endpoints
@router.post("/tokens", response_model=DeviceTokenResponse)
async def register_device_token(token: DeviceTokenCreate, db: AsyncSession = Depends(get_db)):
    """Register a device token for push notifications"""
    # Check if token already exists
    result = await db.execute(
        select(DeviceToken)
        .where(DeviceToken.token == token.token)
    )
    existing_token = result.scalar_one_or_none()
    
    if existing_token:
        # Update existing token
        existing_token.user_id = token.user_id
        existing_token.platform = token.platform
        existing_token.is_active = True
        await db.commit()
        await db.refresh(existing_token)
        return existing_token
    
    db_token = DeviceToken(
        user_id=token.user_id,
        token=token.token,
        platform=token.platform
    )
    db.add(db_token)
    await db.commit()
    await db.refresh(db_token)
    
    return db_token


@router.get("/tokens", response_model=List[DeviceTokenResponse])
async def get_device_tokens(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get all device tokens for a user"""
    result = await db.execute(
        select(DeviceToken)
        .where(DeviceToken.user_id == user_id)
        .where(DeviceToken.is_active == True)
    )
    tokens = result.scalars().all()
    return tokens


@router.put("/tokens/{token_id}", response_model=DeviceTokenResponse)
async def update_device_token(token_id: int, token_update: DeviceTokenUpdate, db: AsyncSession = Depends(get_db)):
    """Update device token"""
    result = await db.execute(select(DeviceToken).where(DeviceToken.id == token_id))
    token = result.scalar_one_or_none()
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device token not found"
        )
    
    # Update fields
    for field, value in token_update.model_dump(exclude_unset=True).items():
        setattr(token, field, value)
    
    await db.commit()
    await db.refresh(token)
    
    return token
