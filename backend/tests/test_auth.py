import pytest
from httpx import AsyncClient


class TestAuth:
    """Tests for authentication endpoints"""
    
    @pytest.mark.asyncio
    async def test_register_user(self, client: AsyncClient):
        """Test user registration"""
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "password": "testpassword123",
                "full_name": "Test User"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        """Test registration with duplicate email"""
        # First registration
        await client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "testpassword123",
                "full_name": "Test User"
            }
        )
        
        # Second registration with same email
        response = await client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "testpassword123",
                "full_name": "Test User"
            }
        )
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_login_user(self, client: AsyncClient):
        """Test user login"""
        # Register user first
        await client.post(
            "/auth/register",
            json={
                "email": "login@example.com",
                "password": "testpassword123",
                "full_name": "Test User"
            }
        )
        
        # Login
        response = await client.post(
            "/auth/login",
            json={
                "email": "login@example.com",
                "password": "testpassword123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials"""
        response = await client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient):
        """Test getting current user with token"""
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "current@example.com",
                "password": "testpassword123",
                "full_name": "Test User"
            }
        )
        
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "current@example.com",
                "password": "testpassword123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Get current user
        response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "current@example.com"
        assert data["full_name"] == "Test User"
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token"""
        response = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
