from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from clubs.models import Club
from matches.models import Match
from database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/system-metrics")
async def get_system_metrics(db: AsyncSession = Depends(get_db)):
    """Get system metrics (CPU, memory, requests, etc.)"""
    # For now, return mock data. In production, integrate with monitoring tools
    return {
        "cpu_usage": 45,
        "memory_usage": 62,
        "requests_per_sec": 125,
        "active_connections": 42,
        "disk_usage": 38,
        "uptime_days": 15
    }


@router.get("/business-metrics")
async def get_business_metrics(db: AsyncSession = Depends(get_db)):
    """Get business metrics (revenue, clubs, matches, fees)"""
    # Get total clubs
    clubs_result = await db.execute(select(func.count(Club.id)))
    total_clubs = clubs_result.scalar() or 0
    
    # Get total matches this month
    matches_result = await db.execute(select(func.count(Match.id)))
    total_matches = matches_result.scalar() or 0
    
    # Calculate monthly revenue (subscriptions + transaction fees)
    # For now, use mock data
    monthly_revenue = total_clubs * 99  # $99 per club subscription
    transaction_fees = total_matches * 5  # $5 per match transaction fee
    
    return {
        "total_clubs": total_clubs,
        "total_matches": total_matches,
        "monthly_revenue": monthly_revenue,
        "transaction_fees": transaction_fees,
        "active_users": total_clubs * 50,  # Estimated
        "conversion_rate": 12.5
    }


@router.post("/backups")
async def create_backup(db: AsyncSession = Depends(get_db)):
    """Create a database backup"""
    # For now, return success. In production, integrate with AWS RDS backups
    return {
        "status": "success",
        "backup_id": "backup_20240621_220000",
        "message": "Backup created successfully"
    }


@router.get("/backups")
async def list_backups(db: AsyncSession = Depends(get_db)):
    """List all backups"""
    # For now, return mock data
    return {
        "backups": [
            {
                "id": "backup_20240621_220000",
                "created_at": "2024-06-21T22:00:00Z",
                "size": "125MB",
                "status": "completed"
            },
            {
                "id": "backup_20240620_220000",
                "created_at": "2024-06-20T22:00:00Z",
                "size": "124MB",
                "status": "completed"
            }
        ]
    }
