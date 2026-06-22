import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from core.config import settings
from core.database import Base
from auth.models import User, UserRole
from core.security import get_password_hash


async def create_admin_user():
    """Create initial admin user"""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        async with session.begin():
            # Check if admin user already exists
            from sqlalchemy import select
            result = await session.execute(
                select(User).where(User.email == "admin@nexasist.com")
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print("Admin user already exists!")
                return
            
            # Create admin user
            admin_user = User(
                email="admin@nexasist.com",
                hashed_password=get_password_hash("NexaSist2026!Admin"),
                full_name="NexaSist Admin",
                is_active=True,
                role=UserRole.ADMIN,
                is_club_admin=True
            )
            
            session.add(admin_user)
            await session.commit()
            
            print("Admin user created successfully!")
            print("Email: admin@nexasist.com")
            print("Password: NexaSist2026!Admin")
            print("IMPORTANT: Change this password after first login!")


if __name__ == "__main__":
    asyncio.run(create_admin_user())
