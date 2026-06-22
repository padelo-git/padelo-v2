import firebase_admin
from firebase_admin import credentials, messaging
from typing import List, Optional
from core.config import settings
import logging

logger = logging.getLogger(__name__)


class FirebaseService:
    """Service for Firebase Cloud Messaging"""
    
    _initialized = False
    
    @classmethod
    def initialize(cls):
        """Initialize Firebase app with credentials"""
        if cls._initialized:
            return
        
        try:
            if settings.FIREBASE_CREDENTIALS_PATH:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
                cls._initialized = True
                logger.info("Firebase initialized successfully")
            else:
                logger.warning("Firebase credentials not configured. Push notifications disabled.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
    
    @classmethod
    async def send_push_notification(
        cls,
        token: str,
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> bool:
        """Send a push notification to a specific device"""
        if not cls._initialized:
            logger.warning("Firebase not initialized, skipping push notification")
            return False
        
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data or {},
                token=token
            )
            
            response = messaging.send(message)
            logger.info(f"Push notification sent successfully: {response}")
            return True
        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
            return False
    
    @classmethod
    async def send_push_notification_to_user(
        cls,
        user_id: int,
        title: str,
        body: str,
        data: Optional[dict] = None,
        db_session = None
    ) -> bool:
        """Send a push notification to all devices of a user"""
        if not cls._initialized:
            logger.warning("Firebase not initialized, skipping push notification")
            return False
        
        try:
            from sqlalchemy import select
            from notifications.models import DeviceToken
            
            if db_session:
                result = await db_session.execute(
                    select(DeviceToken)
                    .where(DeviceToken.user_id == user_id)
                    .where(DeviceToken.is_active == True)
                )
                tokens = result.scalars().all()
                
                if not tokens:
                    logger.warning(f"No active device tokens found for user {user_id}")
                    return False
                
                success_count = 0
                for device_token in tokens:
                    success = await cls.send_push_notification(
                        device_token.token,
                        title,
                        body,
                        data
                    )
                    if success:
                        success_count += 1
                
                logger.info(f"Sent push notification to {success_count}/{len(tokens)} devices for user {user_id}")
                return success_count > 0
            else:
                logger.error("Database session not provided")
                return False
        except Exception as e:
            logger.error(f"Failed to send push notification to user: {e}")
            return False
    
    @classmethod
    async def send_multicast_notification(
        cls,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> int:
        """Send a push notification to multiple devices"""
        if not cls._initialized:
            logger.warning("Firebase not initialized, skipping push notification")
            return 0
        
        try:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data or {},
                tokens=tokens
            )
            
            response = messaging.send_multicast(message)
            
            success_count = response.success_count
            failure_count = response.failure_count
            
            logger.info(f"Multicast notification: {success_count} success, {failure_count} failure")
            return success_count
        except Exception as e:
            logger.error(f"Failed to send multicast notification: {e}")
            return 0
    
    @classmethod
    async def send_topic_notification(
        cls,
        topic: str,
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> bool:
        """Send a push notification to a topic"""
        if not cls._initialized:
            logger.warning("Firebase not initialized, skipping push notification")
            return False
        
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data or {},
                topic=topic
            )
            
            response = messaging.send(message)
            logger.info(f"Topic notification sent successfully: {response}")
            return True
        except Exception as e:
            logger.error(f"Failed to send topic notification: {e}")
            return False
