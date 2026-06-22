import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta


class TestMatches:
    """Tests for matches endpoints"""
    
    @pytest.mark.asyncio
    async def test_create_match(self, client: AsyncClient):
        """Test creating a match"""
        # Create and login user
        await client.post(
            "/auth/register",
            json={
                "email": "matchuser@example.com",
                "password": "testpass123",
                "full_name": "Match User"
            }
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "matchuser@example.com",
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
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
        
        # Create court (skip for now as it requires club admin)
        court_id = 1  # Mock court ID
        
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
                "created_by": 1
            },
            headers={"Authorization": f"Bearer {token}"}
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
    
