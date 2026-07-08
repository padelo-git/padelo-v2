import asyncio
from sqlalchemy import text
from core.database import async_engine


async def migrate():
    """Make user_id nullable in payments table for manual club payments"""
    
    async with async_engine.begin() as conn:
        # Alter the user_id column to be nullable
        await conn.execute(text(
            "ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL"
        ))
        
        print("Successfully made user_id nullable in payments table")


if __name__ == "__main__":
    asyncio.run(migrate())
