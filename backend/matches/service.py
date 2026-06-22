from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime, timedelta
from typing import List, Optional
from matches.models import Match, MatchRequest, MatchInvitation
from auth.models import User


class MatchingService:
    """Service for matching players and creating matches"""
    
    @staticmethod
    async def find_available_players(
        db: AsyncSession,
        club_id: int,
        category: Optional[str] = None,
        gender: Optional[str] = None,
        preferred_time: Optional[str] = None
    ) -> List[User]:
        """Find available players based on criteria"""
        query = select(User).where(User.is_active == True)
        
        if category:
            # TODO: Add category filtering when user has category preference
            pass
        
        if gender:
            # TODO: Add gender filtering when user has gender preference
            pass
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_match_requests(
        db: AsyncSession,
        club_id: int,
        status: str = "pending"
    ) -> List[MatchRequest]:
        """Get pending match requests for a club"""
        result = await db.execute(
            select(MatchRequest)
            .where(and_(
                MatchRequest.club_id == club_id,
                MatchRequest.status == status
            ))
        )
        return result.scalars().all()
    
    @staticmethod
    async def suggest_matches(
        db: AsyncSession,
        club_id: int,
        date: datetime,
        category: Optional[str] = None,
        gender: Optional[str] = None
    ) -> List[dict]:
        """Suggest possible matches based on requests"""
        # Get pending requests
        requests = await MatchingService.get_match_requests(db, club_id, "pending")
        
        # Filter by date proximity (within 3 days)
        date_range_start = date - timedelta(days=3)
        date_range_end = date + timedelta(days=3)
        
        filtered_requests = [
            r for r in requests
            if date_range_start <= r.date <= date_range_end
        ]
        
        # Group by category and gender
        suggestions = []
        for request in filtered_requests:
            if category and request.category != category:
                continue
            if gender and request.gender != gender:
                continue
            
            suggestions.append({
                "request_id": request.id,
                "user_id": request.user_id,
                "date": request.date.isoformat(),
                "preferred_time": request.preferred_time,
                "category": request.category,
                "gender": request.gender
            })
        
        return suggestions
    
    @staticmethod
    async def create_match_from_request(
        db: AsyncSession,
        request_id: int,
        court_id: int,
        start_time: str,
        end_time: str,
        price: Optional[int] = None
    ) -> Match:
        """Create a match from a match request"""
        result = await db.execute(
            select(MatchRequest).where(MatchRequest.id == request_id)
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise ValueError("Match request not found")
        
        # Create match
        match = Match(
            club_id=request.club_id,
            court_id=court_id,
            date=request.date,
            start_time=start_time,
            end_time=end_time,
            category=request.category,
            gender=request.gender,
            price=price,
            created_by=request.user_id
        )
        
        db.add(match)
        await db.commit()
        await db.refresh(match)
        
        # Update request status
        request.status = "matched"
        await db.commit()
        
        return match
    
    @staticmethod
    async def get_available_slots(
        db: AsyncSession,
        club_id: int,
        date: datetime
    ) -> List[dict]:
        """Get available time slots for a club on a specific date"""
        # Get all matches for the club on that date
        result = await db.execute(
            select(Match).where(and_(
                Match.club_id == club_id,
                Match.date == date,
                Match.status.in_(["pending", "confirmed"])
            ))
        )
        matches = result.scalars().all()
        
        # Calculate available slots (simplified - assumes 1-hour slots from 8:00 to 22:00)
        all_slots = []
        for hour in range(8, 22):
            slot_start = f"{hour:02d}:00"
            slot_end = f"{hour+1:02d}:00"
            
            # Check if slot is taken
            is_available = True
            for match in matches:
                if match.start_time == slot_start:
                    is_available = False
                    break
            
            if is_available:
                all_slots.append({
                    "start_time": slot_start,
                    "end_time": slot_end,
                    "available": True
                })
        
        return all_slots
