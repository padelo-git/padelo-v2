from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from matching.auto_matcher import AutoMatcher

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()
auto_matcher = None


async def matching_job():
    """Background job that runs the matching cycle"""
    global auto_matcher
    
    try:
        # Get a database session
        async for db in get_db():
            auto_matcher = AutoMatcher(db)
            await auto_matcher.run_matching_cycle()
            break
    except Exception as e:
        logger.error(f"Error in matching job: {e}")


async def timeout_check_job():
    """Background job that checks for 15-minute timeouts"""
    global auto_matcher
    
    try:
        async for db in get_db():
            auto_matcher = AutoMatcher(db)
            await auto_matcher.check_timeouts()
            break
    except Exception as e:
        logger.error(f"Error in timeout check job: {e}")


async def reminder_job():
    """Background job that schedules and sends reminders"""
    global auto_matcher
    
    try:
        async for db in get_db():
            auto_matcher = AutoMatcher(db)
            await auto_matcher.schedule_reminders()
            break
    except Exception as e:
        logger.error(f"Error in reminder job: {e}")


def start_scheduler():
    """Start the background scheduler"""
    # Run matching cycle every 5 minutes
    scheduler.add_job(
        matching_job,
        trigger=IntervalTrigger(minutes=5),
        id='matching_cycle',
        name='Matching Cycle',
        replace_existing=True
    )
    
    # Check timeouts every 2 minutes
    scheduler.add_job(
        timeout_check_job,
        trigger=IntervalTrigger(minutes=2),
        id='timeout_check',
        name='Timeout Check',
        replace_existing=True
    )
    
    # Schedule reminders every 10 minutes
    scheduler.add_job(
        reminder_job,
        trigger=IntervalTrigger(minutes=10),
        id='reminder_check',
        name='Reminder Check',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Background scheduler started")


def stop_scheduler():
    """Stop the background scheduler"""
    scheduler.shutdown()
    logger.info("Background scheduler stopped")
