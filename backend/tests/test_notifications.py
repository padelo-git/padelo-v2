import pytest
from httpx import AsyncClient


class TestNotifications:
    """Tests for notifications endpoints"""
    
    @pytest.mark.asyncio
    async def test_create_notification(self, client: AsyncClient):
        """Test creating a notification"""
        # Create and login user
        await client.post(
            "/auth/register",
            json={
                "email": "notifuser@example.com",
                "password": "testpass123",
                "full_name": "Notification User"
            }
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "notifuser@example.com",
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        user_id = 1  # Mock user ID
        
        # Create notification
        response = await client.post(
            "/notifications/",
            json={
                "user_id": user_id,
                "title": "Test Notification",
                "body": "This is a test notification",
                "notification_type": "match",
                "data": '{"match_id": 1}'
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == user_id
        assert data["title"] == "Test Notification"
        assert data["is_read"] == False
    
    @pytest.mark.asyncio
    async def test_get_notifications(self, client: AsyncClient):
        """Test getting all notifications"""
        # Create user first
        user_response = await client.post(
            "/auth/register",
            json={
                "email": "getnotif@example.com",
                "password": "testpass123",
                "full_name": "Get Notif User"
            }
        )
        user_id = user_response.json()["id"]
        
        response = await client.get(f"/notifications/?user_id={user_id}")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    @pytest.mark.asyncio
    async def test_mark_notification_as_read(self, client: AsyncClient):
        """Test marking a notification as read"""
        # Create and login user
        await client.post(
            "/auth/register",
            json={
                "email": "readuser@example.com",
                "password": "testpass123",
                "full_name": "Read User"
            }
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "readuser@example.com",
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        user_id = 1  # Mock user ID
        
        # Create notification
        notif_response = await client.post(
            "/notifications/",
            json={
                "user_id": user_id,
                "title": "Test Notification",
                "body": "This is a test notification",
                "notification_type": "match"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        notif_id = notif_response.json()["id"]
        
        # Mark as read
        response = await client.put(
            f"/notifications/{notif_id}",
            json={"is_read": True},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_read"] == True
    
    @pytest.mark.asyncio
    async def test_create_device_token(self, client: AsyncClient):
        """Test creating a device token"""
        # Create user
        user_response = await client.post(
            "/auth/register",
            json={
                "email": "tokenuser@example.com",
                "password": "testpass123",
                "full_name": "Token User"
            }
        )
        user_id = user_response.json()["id"]
        
        # Create device token
        response = await client.post(
            "/notifications/tokens",
            json={
                "user_id": user_id,
                "token": "test_device_token_123",
                "platform": "ios"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == user_id
        assert data["token"] == "test_device_token_123"
        assert data["platform"] == "ios"
        assert data["is_active"] == True
    
