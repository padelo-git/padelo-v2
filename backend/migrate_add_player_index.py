import asyncio
from sqlalchemy import text
from core.database import engine


async def migrate():
    """Add player_index column to payments table"""
    async with engine.begin() as conn:
        # Check if column already exists
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'player_index'
        """))
        
        if result.fetchone():
            print("Column player_index already exists in payments table")
            return
        
        # Add the column
        await conn.execute(text("""
            ALTER TABLE payments ADD COLUMN player_index INTEGER
        """))
        print("Successfully added player_index column to payments table")


if __name__ == "__main__":
    asyncio.run(migrate())
