#!/usr/bin/env python3
"""
Script to delete a club and all related data by email
WARNING: This will permanently delete the club and all associated data
"""
import asyncio
from sqlalchemy import text
from core.database import engine


async def delete_club_by_email(email):
    """Delete a club and all related data by email"""
    async with engine.begin() as conn:
        # First, get the club ID
        result = await conn.execute(text("SELECT id FROM clubs WHERE email = :email"), {"email": email})
        club = result.fetchone()
        
        if not club:
            print(f"No club found with email: {email}")
            return
        
        club_id = club[0]
        print(f"Found club with ID: {club_id}")
        
        # Delete related data in correct order (respecting foreign keys)
        print("Deleting related data...")
        
        # Delete penalties
        await conn.execute(text("DELETE FROM penalties WHERE club_id = :club_id"), {"club_id": club_id})
        print("  - Penalties deleted")
        
        # Delete cash registers
        await conn.execute(text("DELETE FROM cash_registers WHERE club_id = :club_id"), {"club_id": club_id})
        print("  - Cash registers deleted")
        
        # Delete debts
        await conn.execute(text("DELETE FROM debts WHERE club_id = :club_id"), {"club_id": club_id})
        print("  - Debts deleted")
        
        # Delete payments
        await conn.execute(text("DELETE FROM payments WHERE club_id = :club_id"), {"club_id": club_id})
        print("  - Payments deleted")
        
        # Delete reservations
        await conn.execute(text("DELETE FROM reservations WHERE club_id = :club_id"), {"club_id": club_id})
        print("  - Reservations deleted")
        
        # Delete courts
        await conn.execute(text("DELETE FROM courts WHERE club_id = :club_id"), {"club_id": club_id})
        print("  - Courts deleted")
        
        # Delete users associated with this club
        await conn.execute(text("DELETE FROM users WHERE club_id = :club_id"), {"club_id": club_id})
        print("  - Users deleted")
        
        # Finally, delete the club
        await conn.execute(text("DELETE FROM clubs WHERE id = :club_id"), {"club_id": club_id})
        print("  - Club deleted")
        
        print(f"\n✅ Club with email '{email}' and all related data have been deleted successfully")


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python delete_club_by_email.py <email>")
        print("Example: python delete_club_by_email.py davidgctd@gmail.com")
        sys.exit(1)
    
    email = sys.argv[1]
    print(f"⚠️  WARNING: This will permanently delete the club with email '{email}' and all related data!")
    print("This action cannot be undone.")
    
    confirm = input("Are you sure you want to continue? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Operation cancelled.")
        sys.exit(0)
    
    asyncio.run(delete_club_by_email(email))
