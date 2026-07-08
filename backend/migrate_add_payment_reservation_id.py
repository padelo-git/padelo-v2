"""
Migración para agregar el campo reservation_id a la tabla payments
Esto permite vincular los pagos a las reservas, como en el sistema viejo
"""
import asyncio
from sqlalchemy import text
from core.database import engine

async def migrate():
    async with engine.begin() as conn:
        # Agregar columna reservation_id a la tabla payments
        await conn.execute(text("""
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS reservation_id INTEGER REFERENCES reservations(id)
        """))
        print("Columna reservation_id agregada a la tabla payments")

if __name__ == "__main__":
    asyncio.run(migrate())
