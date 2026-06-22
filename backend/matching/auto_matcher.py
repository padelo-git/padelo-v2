import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from matches.models import Match, MatchInvitation
from auth.models import User
from notifications.firebase_service import FirebaseService
import logging

logger = logging.getLogger(__name__)


class AutoMatcher:
    """Automated matching service that runs 24/7 to create matches"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    async def run_matching_cycle(self):
        """Main matching cycle that runs continuously"""
        logger.info("Starting matching cycle")
        
        # 1. Find available time slots for next 7 days
        await self.find_and_create_match_requests()
        
        # 2. Process pending match requests
        await self.process_pending_requests()
        
        # 3. Check for timeouts (15 min rule)
        await self.check_timeouts()
        
        # 4. Schedule reminders for confirmed matches
        await self.schedule_reminders()
        
        logger.info("Matching cycle completed")
    
    async def find_and_create_match_requests(self):
        """Find available slots and create match requests"""
        # Get all clubs with courts
        from clubs.models import Club, Court
        
        clubs_result = await self.db.execute(select(Club))
        clubs = clubs_result.scalars().all()
        
        for club in clubs:
            courts_result = await self.db.execute(
                select(Court).where(Court.club_id == club.id)
            )
            courts = courts_result.scalars().all()
            
            for court in courts:
                # Check next 7 days for available slots
                for day_offset in range(7):
                    date = datetime.now().date() + timedelta(days=day_offset)
                    
                    # Check each hour slot (8 AM to 10 PM)
                    for hour in range(8, 22):
                        slot_start = f"{hour:02d}:00"
                        slot_end = f"{hour+1:02d}:00"
                        
                        # Check if slot is already booked
                        existing = await self.db.execute(
                            select(Match).where(
                                Match.court_id == court.id,
                                Match.date == date,
                                Match.start_time == slot_start
                            )
                        )
                        if existing.scalar_one_or_none():
                            continue
                        
                        # Create match request if not exists
                        await self.create_match_request(club, court, date, slot_start, slot_end)
    
    async def create_match_request(self, club, court, date, start_time, end_time):
        """Create a match request for automated matching"""
        # For now, create a placeholder match request
        # In production, this would be a separate MatchRequest model
        logger.info(f"Creating match request for {club.name} - {court.name} on {date} at {start_time}")
    
    async def process_pending_requests(self):
        """Process pending match requests and invite players"""
        # Find match requests that need players
        # For each request, find 4 matching players (2 right, 2 left, same category, gender, availability)
        
        # Mock implementation
        logger.info("Processing pending match requests")
    
    async def check_timeouts(self):
        """Check for players who haven't responded in 15 minutes"""
        timeout_threshold = datetime.now() - timedelta(minutes=15)
        
        # Find invitations older than 15 minutes with no response
        invitations_result = await self.db.execute(
            select(MatchInvitation).where(
                MatchInvitation.status == "pending",
                MatchInvitation.created_at < timeout_threshold
            )
        )
        timed_out_invitations = invitations_result.scalars().all()
        
        for invitation in timed_out_invitations:
            # Move player to waitlist
            await self.move_to_waitlist(invitation)
            
            # Find replacement player
            await self.find_replacement_player(invitation)
            
            logger.info(f"Timeout for invitation {invitation.id}, moved to waitlist")
    
    async def move_to_waitlist(self, invitation):
        """Move a player to waitlist after timeout"""
        invitation.status = "waitlisted"
        await self.db.commit()
    
    async def find_replacement_player(self, invitation):
        """Find a replacement player for a timed-out invitation"""
        # Find players matching the same criteria
        # Send invitation to new player
        logger.info(f"Finding replacement for invitation {invitation.id}")
    
    async def schedule_reminders(self):
        """Schedule reminders for confirmed matches"""
        # Find matches that are confirmed and scheduled in the future
        # Schedule reminders at:
        # - 24 hours before
        # - 2 hours before
        # - 30 minutes before
        
        logger.info("Scheduling reminders for confirmed matches")
    
    async def send_invitation(self, user_id, match_id):
        """Send invitation to a player via push notification"""
        try:
            await FirebaseService.send_push_notification_to_user(
                user_id=user_id,
                title="¡Partido disponible!",
                body="Tienes una invitación para un partido de pádel",
                data={"match_id": match_id, "type": "match_invitation"},
                db_session=self.db
            )
        except Exception as e:
            logger.error(f"Failed to send invitation: {e}")
    
    async def send_reminder(self, user_id, match_id, time_until_match):
        """Send reminder to a player before match"""
        try:
            await FirebaseService.send_push_notification_to_user(
                user_id=user_id,
                title="Recordatorio de partido",
                body=f"Tienes un partido en {time_until_match}",
                data={"match_id": match_id, "type": "match_reminder"},
                db_session=self.db
            )
        except Exception as e:
            logger.error(f"Failed to send reminder: {e}")
