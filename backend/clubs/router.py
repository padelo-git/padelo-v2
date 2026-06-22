from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from core.database import get_db
from core.security import get_current_user, get_current_club_admin
from clubs.models import Club, Court, Reservation
from clubs.schemas import (
    ClubCreate, ClubUpdate, ClubResponse, ClubWithCourts,
    CourtCreate, CourtUpdate, CourtResponse,
    ReservationCreate, ReservationUpdate, ReservationResponse
)

router = APIRouter()


# Club endpoints
@router.post("/", response_model=ClubResponse)
async def create_club(club: ClubCreate, db: AsyncSession = Depends(get_db)):
    """Create a new club"""
    # Check if email already exists
    result = await db.execute(select(Club).where(Club.email == club.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if slug already exists
    result = await db.execute(select(Club).where(Club.slug == club.slug))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already taken"
        )
    
    # Create club (password should be hashed by auth module)
    from core.security import get_password_hash
    hashed_password = get_password_hash(club.password)
    
    db_club = Club(
        name=club.name,
        slug=club.slug,
        email=club.email,
        phone=club.phone,
        address=club.address,
        city=club.city,
        country=club.country,
        description=club.description,
        logo_url=club.logo_url,
        hashed_password=hashed_password
    )
    db.add(db_club)
    await db.commit()
    await db.refresh(db_club)
    
    return db_club


@router.get("/", response_model=List[ClubResponse])
async def get_clubs(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Get all clubs"""
    result = await db.execute(select(Club).offset(skip).limit(limit))
    clubs = result.scalars().all()
    return clubs


@router.get("/{club_id}", response_model=ClubWithCourts)
async def get_club(club_id: int, db: AsyncSession = Depends(get_db)):
    """Get club by ID with courts"""
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    # Get courts
    courts_result = await db.execute(select(Court).where(Court.club_id == club_id))
    courts = courts_result.scalars().all()
    
    return ClubWithCourts(
        **club.__dict__,
        courts=courts
    )


@router.put("/{club_id}", response_model=ClubResponse)
async def update_club(
    club_id: int, 
    club_update: ClubUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_club_admin)
):
    """Update club (requires club admin)"""
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    # Update fields
    for field, value in club_update.model_dump(exclude_unset=True).items():
        setattr(club, field, value)
    
    await db.commit()
    await db.refresh(club)
    
    return club


# Court endpoints
@router.post("/{club_id}/courts", response_model=CourtResponse)
async def create_court(club_id: int, court: CourtCreate, db: AsyncSession = Depends(get_db)):
    """Create a new court for a club"""
    # Check if club exists
    result = await db.execute(select(Club).where(Club.id == club_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    db_court = Court(
        club_id=club_id,
        name=court.name,
        number=court.number,
        surface=court.surface,
        is_indoor=court.is_indoor
    )
    db.add(db_court)
    await db.commit()
    await db.refresh(db_court)
    
    return db_court


@router.get("/{club_id}/courts", response_model=List[CourtResponse])
async def get_courts(club_id: int, db: AsyncSession = Depends(get_db)):
    """Get all courts for a club"""
    result = await db.execute(select(Court).where(Court.club_id == club_id))
    courts = result.scalars().all()
    return courts


@router.get("/{club_id}/statistics")
async def get_club_statistics(club_id: int, db: AsyncSession = Depends(get_db)):
    """Get statistics for a club"""
    # Get total courts
    courts_result = await db.execute(select(Court).where(Court.club_id == club_id))
    courts = courts_result.scalars().all()
    total_courts = len(courts)
    
    # Get total matches
    from matches.models import Match
    matches_result = await db.execute(select(Match).where(Match.club_id == club_id))
    matches = matches_result.scalars().all()
    total_matches = len(matches)
    
    # Get completed matches
    completed_matches = len([m for m in matches if m.status == "completed"])
    
    # Get pending matches
    pending_matches = len([m for m in matches if m.status == "pending"])
    
    return {
        "total_courts": total_courts,
        "total_matches": total_matches,
        "completed_matches": completed_matches,
        "pending_matches": pending_matches,
        "completion_rate": round(completed_matches / total_matches * 100, 1) if total_matches > 0 else 0
    }


@router.put("/courts/{court_id}", response_model=CourtResponse)
async def update_court(court_id: int, court_update: CourtUpdate, db: AsyncSession = Depends(get_db)):
    """Update court"""
    result = await db.execute(select(Court).where(Court.id == court_id))
    court = result.scalar_one_or_none()
    
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found"
        )
    
    # Update fields
    for field, value in court_update.model_dump(exclude_unset=True).items():
        setattr(court, field, value)
    
    await db.commit()
    await db.refresh(court)
    
    return court


# Reservation endpoints
@router.post("/{club_id}/reservations", response_model=ReservationResponse)
async def create_reservation(
    club_id: int, 
    reservation: ReservationCreate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new reservation (requires authentication)"""
    # Check if club exists
    result = await db.execute(select(Club).where(Club.id == club_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    # Check if court exists
    result = await db.execute(select(Court).where(Court.id == reservation.court_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found"
        )
    
    db_reservation = Reservation(
        club_id=club_id,
        court_id=reservation.court_id,
        user_id=reservation.user_id,
        date=reservation.date,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
        price=reservation.price,
        notes=reservation.notes
    )
    db.add(db_reservation)
    await db.commit()
    await db.refresh(db_reservation)
    
    return db_reservation


@router.get("/{club_id}/reservations", response_model=List[ReservationResponse])
async def get_reservations(club_id: int, db: AsyncSession = Depends(get_db)):
    """Get all reservations for a club"""
    result = await db.execute(select(Reservation).where(Reservation.club_id == club_id))
    reservations = result.scalars().all()
    return reservations


@router.put("/reservations/{reservation_id}", response_model=ReservationResponse)
async def update_reservation(reservation_id: int, reservation_update: ReservationUpdate, db: AsyncSession = Depends(get_db)):
    """Update reservation"""
    result = await db.execute(select(Reservation).where(Reservation.id == reservation_id))
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    # Update fields
    for field, value in reservation_update.model_dump(exclude_unset=True).items():
        setattr(reservation, field, value)
    
    await db.commit()
    await db.refresh(reservation)
    
    return reservation
