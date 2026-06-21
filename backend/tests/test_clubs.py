import pytest
from httpx import AsyncClient


class TestClubs:
    """Tests for clubs endpoints"""
    
    @pytest.mark.asyncio
    async def test_create_club(self, client: AsyncClient):
        """Test club creation"""
        response = await client.post(
            "/clubs/",
            json={
                "name": "Test Club",
                "slug": "test-club",
                "email": "club@example.com",
                "password": "clubpassword123",
                "phone": "1234567890",
                "address": "Test Address",
                "city": "Test City"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Club"
        assert data["slug"] == "test-club"
        assert data["email"] == "club@example.com"
    
    @pytest.mark.asyncio
    async def test_get_clubs(self, client: AsyncClient):
        """Test getting all clubs"""
        # Create a club first
        await client.post(
            "/clubs/",
            json={
                "name": "Test Club",
                "slug": "test-club",
                "email": "club@example.com",
                "password": "clubpassword123"
            }
        )
        
        response = await client.get("/clubs/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
    
    @pytest.mark.asyncio
    async def test_get_club(self, client: AsyncClient):
        """Test getting a specific club"""
        # Create a club first
        create_response = await client.post(
            "/clubs/",
            json={
                "name": "Test Club",
                "slug": "test-club",
                "email": "club@example.com",
                "password": "clubpassword123"
            }
        )
        club_id = create_response.json()["id"]
        
        response = await client.get(f"/clubs/{club_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == club_id
        assert data["name"] == "Test Club"
    
    @pytest.mark.asyncio
    async def test_create_court(self, client: AsyncClient):
        """Test court creation"""
        # Create a club first
        club_response = await client.post(
            "/clubs/",
            json={
                "name": "Test Club",
                "slug": "test-club",
                "email": "club@example.com",
                "password": "clubpassword123"
            }
        )
        club_id = club_response.json()["id"]
        
        # Create a court
        response = await client.post(
            f"/clubs/{club_id}/courts",
            json={
                "club_id": club_id,
                "name": "Court 1",
                "number": 1,
                "surface": "Césped"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Court 1"
        assert data["number"] == 1
    
    @pytest.mark.asyncio
    async def test_get_courts(self, client: AsyncClient):
        """Test getting all courts for a club"""
        # Create a club first
        club_response = await client.post(
            "/clubs/",
            json={
                "name": "Test Club",
                "slug": "test-club",
                "email": "club@example.com",
                "password": "clubpassword123"
            }
        )
        club_id = club_response.json()["id"]
        
        # Create a court
        await client.post(
            f"/clubs/{club_id}/courts",
            json={
                "club_id": club_id,
                "name": "Court 1",
                "number": 1
            }
        )
        
        response = await client.get(f"/clubs/{club_id}/courts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
