import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta


class TestMatches:
    """Tests for matches endpoints"""
    
    @pytest.mark.asyncio
    async def test_create_match(self, client: AsyncClient):
        """Test creating a match"""
        # Create club first
        club_response = await client.post(
            "/clubs/",
            json={
                "name": "Test Club",
                "slug": "test-club-match",
                "email": "match@club.com",
                "password": "clubpass123"
            }
        )
        club_id = club_response.json()["id"]
        
        # Create court
        court_response = await client.post(
            f"/clubs/{club_id}/courts",
            json={
                "club_id": club_id,
                "name": "Court 1",
                "number": 1,
                "surface": "Césped"
            }
        )
        court_id = court_response.json()["id"]
        
        # Create user
        user_response = await client.post(
            "/auth/register",
            json={
                "email": "matchuser@example.com",
                "password": "testpass123",
                "full_name": "Match User"
            }
        )
        user_id = user_response.json()["id"]
        
        # Create match
        tomorrow = datetime.now() + timedelta(days=1)
        response = await client.post(
            "/matches/",
            json={
                "club_id": club_id,
                "court_id": court_id,
                "date": tomorrow.isoformat(),
                "start_time": "10:00",
                "end_time": "11:00",
                "category": "Intermedio",
                "gender": "mixed",
                "created_by": user_id
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["club_id"] == club_id
        assert data["court_id"] == court_id
        assert data["status"] == "pending"
    
    @pytest.mark.asyncio
    async def test_get_matches(self, client: AsyncClient):
        """Test getting all matches"""
        response = await client.get("/matches/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    @pytest.mark.asyncio
    async def test_create_match_invitation(self, client: AsyncClient):
        """Test creating a match invitation"""
        # Create club and court
        club_response = await client.post(
            "/clubs/",
            json={
                "name": "Test Club Inv",
                "slug": "test-club-inv",
                "email": "inv@club.com",
                "password": "clubpass123"
            }
        )
        club_id = club_response.json()["id"]
        
        court_response = await client.post(
            f"/clubs/{club_id}/courts",
            json={
                "club_id": club_id,
                "name": "Court 1",
                "number": 1,
                "surface": "Césped"
            }
        )
        court_id = court_response.json()["id"]
        
        # Create users
        user1_response = await client.post(
            "/auth/register",
            json={
                "email": "inviter@example.com",
                "password": "testpass123",
                "full_name": "Inviter"
            }
        )
        user1_id = user1_response.json()["id"]
        
        user2_response = await client.post(
            "/auth/register",
            json={
                "email": "invitee@example.com",
                "password": "testpass123",
                "full_name": "Invitee"
            }
        )
        user2_id = user2_response.json()["id"]
        
        # Create match
        tomorrow = datetime.now() + timedelta(days=1)
        match_response = await client.post(
            "/matches/",
            json={
                "club_id": club_id,
                "court_id": court_id,
                "date": tomorrow.isoformat(),
                "start_time": "10:00",
                "end_time": "11:00",
                "created_by": user1_id
            }
        )
        match_id = match_response.json()["id"]
        
        # Create invitation
        response = await client.post(
            f"/matches/{match_id}/invitations",
            json={
                "match_id": match_id,
                "user_id": user2_id,
                "position": 2
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["match_id"] == match_id
        assert data["user_id"] == user2_id
        assert data["status"] == "pending"
