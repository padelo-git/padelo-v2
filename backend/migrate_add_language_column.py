#!/usr/bin/env python3
"""
Migration script to add language column to clubs table
Run this on production to add the missing language column
"""
import asyncio
from sqlalchemy import text
from core.database import engine


async def migrate():
    """Add language column to clubs table"""
    async with engine.begin() as conn:
        # Add language column
        await conn.execute(text("""
            ALTER TABLE clubs 
            ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es'
        """))
        
        print("Migration completed successfully - language column added")


if __name__ == "__main__":
    asyncio.run(migrate())
