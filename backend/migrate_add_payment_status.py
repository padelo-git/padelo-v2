import asyncio
from sqlalchemy import text
from core.database import engine


async def migrate():
    """Add payment_status column to reservations table"""

    async with engine.begin() as conn:
        # Add payment_status column with default value 'unpaid'
        await conn.execute(text(
            "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'unpaid'"
        ))

        print("Successfully added payment_status column to reservations table")


if __name__ == "__main__":
    asyncio.run(migrate())
