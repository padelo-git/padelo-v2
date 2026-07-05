#!/usr/bin/env python3
"""
Migration script to add players column to reservations table
Run this on production to add the missing players column
"""
import asyncio
from sqlalchemy import text
from core.database import engine


async def migrate():
    """Add players column to reservations table"""
    async with engine.begin() as conn:
        # Add players column as JSON
        await conn.execute(text("""
            ALTER TABLE reservations 
            ADD COLUMN IF NOT EXISTS players JSON
        """))
        
        print("Migration completed successfully - players column added")


if __name__ == "__main__":
    asyncio.run(migrate())
