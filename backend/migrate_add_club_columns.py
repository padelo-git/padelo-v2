#!/usr/bin/env python3
"""
Migration script to add missing columns to clubs table
Run this on production to add all missing columns
"""
import asyncio
from sqlalchemy import text
from core.database import engine


async def migrate():
    """Add missing columns to clubs table"""
    async with engine.begin() as conn:
        # Add fiscal columns
        await conn.execute(text("""
            ALTER TABLE clubs 
            ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
            ADD COLUMN IF NOT EXISTS tax_name VARCHAR(100)
        """))
        
        # Add subscription columns
        await conn.execute(text("""
            ALTER TABLE clubs 
            ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
            ADD COLUMN IF NOT EXISTS subscription_plan_id INTEGER,
            ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(10, 2) DEFAULT 200.00
        """))
        
        # Add trial columns
        await conn.execute(text("""
            ALTER TABLE clubs 
            ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS grace_period_end_date TIMESTAMP
        """))
        
        # Add configuration columns
        await conn.execute(text("""
            ALTER TABLE clubs 
            ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
            ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'America/Argentina/Buenos_Aires'
        """))
        
        # Add pricing columns
        await conn.execute(text("""
            ALTER TABLE clubs 
            ADD COLUMN IF NOT EXISTS price_per_hour NUMERIC(10, 2) DEFAULT 200.00,
            ADD COLUMN IF NOT EXISTS class_price_1_2_total NUMERIC(10, 2),
            ADD COLUMN IF NOT EXISTS class_price_3_per_student NUMERIC(10, 2),
            ADD COLUMN IF NOT EXISTS class_price_4_per_student NUMERIC(10, 2)
        """))
        
        # Add operating hours columns
        await conn.execute(text("""
            ALTER TABLE clubs 
            ADD COLUMN IF NOT EXISTS day_start_min INTEGER DEFAULT 480,
            ADD COLUMN IF NOT EXISTS day_end_min INTEGER DEFAULT 1320
        """))
        
        print("Migration completed successfully")


if __name__ == "__main__":
    asyncio.run(migrate())
