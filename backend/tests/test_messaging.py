import pytest
from httpx import AsyncClient


class TestMessaging:
    """Tests for messaging endpoints"""
    
    @pytest.mark.asyncio
    async def test_create_message(self, client: AsyncClient):
        """Test creating a message"""
        # Create and login user
        await client.post(
            "/auth/register",
            json={
                "email": "msguser@example.com",
                "password": "testpass123",
                "full_name": "Message User"
            }
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "msguser@example.com",
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create club
        club_response = await client.post(
            "/clubs/",
            json={
                "name": "Test Club Msg",
                "slug": "test-club-msg",
                "email": "msg@club.com",
                "password": "clubpass123"
            }
        )
        club_id = club_response.json()["id"]
        
        user_id = 1  # Mock user ID
        
        # Create message
        response = await client.post(
            "/messaging/",
            json={
                "club_id": club_id,
                "sender_id": user_id,
                "content": "Hello, this is a test message",
                "message_type": "text",
                "is_announcement": False
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["club_id"] == club_id
        assert data["sender_id"] == user_id
        assert data["content"] == "Hello, this is a test message"
    
    @pytest.mark.asyncio
    async def test_get_messages(self, client: AsyncClient):
        """Test getting all messages"""
        # Create club first
        club_response = await client.post(
            "/clubs/",
            json={
                "name": "Test Club GetMsg",
                "slug": "test-club-getmsg",
                "email": "getmsg@club.com",
                "password": "clubpass123"
            }
        )
        club_id = club_response.json()["id"]
        
        response = await client.get(f"/messaging/?club_id={club_id}")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    @pytest.mark.asyncio
    async def test_create_conversation(self, client: AsyncClient):
        """Test creating a conversation"""
        # Create club
        club_response = await client.post(
            "/clubs/",
            json={
                "name": "Test Club Conv",
                "slug": "test-club-conv",
                "email": "conv@club.com",
                "password": "clubpass123"
            }
        )
        club_id = club_response.json()["id"]
        
        # Create user
        user_response = await client.post(
            "/auth/register",
            json={
                "email": "convuser@example.com",
                "password": "testpass123",
                "full_name": "Conversation User"
            }
        )
        user_id = user_response.json()["id"]
        
        # Create conversation
        response = await client.post(
            "/messaging/conversations",
            json={
                "club_id": club_id,
                "user_id": user_id
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["club_id"] == club_id
        assert data["user_id"] == user_id
        assert data["is_active"] == True
    
