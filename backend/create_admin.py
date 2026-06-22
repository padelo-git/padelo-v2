import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from core.config import settings
from core.security import get_password_hash


async def create_admin_user():
    """Create initial admin user using raw SQL to avoid circular dependencies"""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # Check if admin user already exists
        result = await conn.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": "admin@nexasist.com"}
        )
        existing_user = result.fetchone()
        
        if existing_user:
            print("Admin user already exists!")
            return
        
        # Create admin user using raw SQL
        hashed_password = get_password_hash("NexaSist2026!Admin")
        
        await conn.execute(
            text("""
                INSERT INTO users (email, hashed_password, full_name, is_active, role, is_club_admin, club_id, created_at, updated_at)
                VALUES (:email, :hashed_password, :full_name, :is_active, :role, :is_club_admin, NULL, NOW(), NOW())
            """),
            {
                "email": "admin@nexasist.com",
                "hashed_password": hashed_password,
                "full_name": "NexaSist Admin",
                "is_active": True,
                "role": "admin",
                "is_club_admin": True
            }
        )
        
        print("Admin user created successfully!")
        print("Email: admin@nexasist.com")
        print("Password: NexaSist2026!Admin")
        print("IMPORTANT: Change this password after first login!")


if __name__ == "__main__":
    asyncio.run(create_admin_user())
