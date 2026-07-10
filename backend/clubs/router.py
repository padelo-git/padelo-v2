from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime
from core.database import get_db
from core.security import get_current_club, verify_password, create_access_token
from clubs.models import Club, Court, Reservation, Payment, Debt, CashRegister, Penalty
from clubs.schemas import (
    ClubCreate, ClubUpdate, ClubResponse, ClubWithCourts,
    CourtCreate, CourtUpdate, CourtResponse,
    ReservationCreate, ReservationUpdate, ReservationResponse
)
from pydantic import BaseModel, EmailStr

router = APIRouter()


def get_language_from_country(country: str) -> str:
    """Assign language based on country"""
    country_lower = country.lower()
    
    # English-speaking countries
    if country_lower in ['united states', 'usa', 'us', 'united kingdom', 'uk', 'great britain', 'canada', 'australia', 'new zealand', 'ireland']:
        return 'en'
    
    # Italian-speaking countries
    if country_lower in ['italy', 'italia', 'san marino', 'vatican city']:
        return 'it'
    
    # Portuguese-speaking countries
    if country_lower in ['brazil', 'brasil', 'portugal', 'angola', 'mozambique', 'cape verde']:
        return 'pt'
    
    # Default to Spanish for all other countries (Latin America, Spain, etc.)
    return 'es'


class ClubLogin(BaseModel):
    email: EmailStr
    password: str


class ClubLoginResponse(BaseModel):
    access_token: str
    token_type: str
    club: ClubResponse


# Club endpoints
@router.post("/", response_model=ClubResponse)
async def create_club(club: ClubCreate, db: AsyncSession = Depends(get_db)):
    """Create a new club"""
    import logging
    import traceback
    import re
    logger = logging.getLogger(__name__)
    
    try:
        # Check if email already exists
        result = await db.execute(select(Club).where(Club.email == club.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Generate slug automatically from club name if not provided
        if not club.slug:
            slug = club.name.lower()
            slug = re.sub(r'[^a-z0-9\s-]', '', slug)  # Remove special characters
            slug = re.sub(r'\s+', '-', slug)  # Replace spaces with hyphens
            slug = slug.strip('-')  # Remove leading/trailing hyphens
        else:
            slug = club.slug

        # Check if slug already exists, if so append a number
        base_slug = slug
        counter = 1
        while True:
            result = await db.execute(select(Club).where(Club.slug == slug))
            if not result.scalar_one_or_none():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Create club (password should be hashed by auth module)
        from core.security import get_password_hash
        hashed_password = get_password_hash(club.password)

        # Assign language based on country
        language = get_language_from_country(club.country)

        logger.info(f"Creating club: {club.name} with slug: {slug} and language: {language}")

        db_club = Club(
            name=club.name,
            slug=slug,
            email=club.email,
            phone=club.phone,
            address=club.address,
            city=club.city,
            country=club.country,
            description=club.description,
            logo_url=club.logo_url,
            hashed_password=hashed_password,
            is_active=False,  # Requires owner activation
            language=language  # Auto-assigned based on country
        )
        db.add(db_club)
        await db.commit()
        await db.refresh(db_club)

        logger.info(f"Club created successfully: {db_club.id}")
        
        # Send email notification to owner
        try:
            from core.email_service import send_club_registration_notification
            await send_club_registration_notification(
                club_name=db_club.name,
                club_email=db_club.email,
                club_city=db_club.city or "Sin ciudad",
                club_country=db_club.country or "Sin país"
            )
            logger.info(f"Email notification sent for club {db_club.id}")
        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
        
        return db_club
    except Exception as e:
        logger.error(f"Error creating club: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating club: {str(e)}"
        )


@router.post("/login", response_model=ClubLoginResponse)
async def login_club(credentials: ClubLogin, db: AsyncSession = Depends(get_db)):
    """Login for club administrators"""
    print(f"=== DEBUG LOGIN ===")
    print(f"Email: {credentials.email}")
    
    # Find club by email (case-insensitive)
    result = await db.execute(select(Club).where(func.lower(Club.email) == credentials.email.lower()))
    club = result.scalar_one_or_none()
    
    print(f"Club found: {club is not None}")
    if club:
        print(f"Club ID: {club.id}, is_active: {club.is_active}")

    if not club:
        print("Club not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    password_valid = verify_password(credentials.password, club.hashed_password)
    print(f"Password valid: {password_valid}")
    
    if not password_valid:
        print("Invalid password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if club is active
    if not club.is_active:
        print("Club not active")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Club account is not active. Please contact support."
        )

    # Create access token with club identification
    access_token = create_access_token(data={
        "sub": str(club.id),
        "type": "club",
        "is_club": True,
        "club_id": str(club.id)
    })
    
    print("Login successful")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "club": club
    }


@router.get("/", response_model=List[ClubResponse])
async def get_clubs(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Get all clubs"""
    result = await db.execute(select(Club).offset(skip).limit(limit))
    clubs = result.scalars().all()
    return clubs


@router.get("/pending/count")
async def get_pending_clubs_count(db: AsyncSession = Depends(get_db)):
    """Get count of clubs pending activation (is_active=False)"""
    result = await db.execute(select(func.count()).where(Club.is_active == False))
    count = result.scalar()
    return {"pending_count": count}


@router.get("/pending", response_model=List[ClubResponse])
async def get_pending_clubs(db: AsyncSession = Depends(get_db)):
    """Get all clubs pending activation (is_active=False)"""
    result = await db.execute(select(Club).where(Club.is_active == False))
    clubs = result.scalars().all()
    return clubs


@router.put("/{club_id}/activate")
async def activate_club(club_id: int, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Activate a club (requires owner/admin)"""
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    club.is_active = True
    await db.commit()
    await db.refresh(club)
    
    return {"message": "Club activated successfully", "club": club}


@router.put("/{club_id}/suspend")
async def suspend_club(club_id: int, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Suspend a club (requires owner/admin)"""
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    club.is_active = False
    await db.commit()
    await db.refresh(club)
    
    return {"message": "Club suspended successfully", "club": club}


@router.delete("/{club_id}")
async def delete_club(club_id: int, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Delete a club (requires owner/admin) - WARNING: This will delete all club data"""
    result = await db.execute(select(Club).where(Club.id == club_id))
    club = result.scalar_one_or_none()
    
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    # Delete club (cascade delete should handle related records)
    await db.delete(club)
    await db.commit()
    
    return {"message": "Club deleted successfully"}


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


@router.get("/{club_id}/courts", response_model=List[CourtResponse])
async def get_club_courts(club_id: int, db: AsyncSession = Depends(get_db)):
    """Get all courts for a specific club"""
    result = await db.execute(select(Court).where(Court.club_id == club_id))
    courts = result.scalars().all()
    return courts


@router.put("/{club_id}", response_model=ClubResponse)
async def update_club(
    club_id: int, 
    club_update: ClubUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """Update club (temporary: no authentication)"""
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
    
    # Check if all required configuration fields are set
    required_fields = [
        club.tax_id,
        club.tax_address,
        club.tax_condition,
        club.stripe_public_key,
        club.stripe_secret_key
    ]
    
    # Mark as configured if all required fields are present
    club.is_configured = all(required_fields)
    
    await db.commit()
    await db.refresh(club)
    
    return club


@router.post("/courts", response_model=CourtResponse)
async def create_court(court: CourtCreate, db: AsyncSession = Depends(get_db)):
    """Create a new court (temporary: no authentication)"""
    db_court = Court(
        club_id=7,  # Temporary: hardcoded club ID
        name=court.name,
        number=court.number,
        surface=court.surface,
        is_indoor=court.is_indoor
    )
    db.add(db_court)
    await db.commit()
    await db.refresh(db_court)
    
    return db_court


@router.get("/courts", response_model=List[CourtResponse])
async def get_courts(db: AsyncSession = Depends(get_db)):
    """Get all courts for club 7 (temporary: no authentication)"""
    result = await db.execute(select(Court).where(Court.club_id == 7).order_by(Court.id))
    courts = result.scalars().all()
    return courts


@router.get("/statistics")
async def get_club_statistics(current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Get statistics for the authenticated club"""
    # Get total courts
    courts_result = await db.execute(select(Court).where(Court.club_id == current_club.id))
    courts = courts_result.scalars().all()
    total_courts = len(courts)
    
    # Get total matches
    from matches.models import Match
    matches_result = await db.execute(select(Match).where(Match.club_id == current_club.id))
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
async def update_court(court_id: int, court_update: CourtUpdate, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Update court (only for the authenticated club)"""
    result = await db.execute(select(Court).where(Court.id == court_id))
    court = result.scalar_one_or_none()
    
    if not court:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Court not found"
        )
    
    # Verify that the court belongs to the authenticated club
    if court.club_id != current_club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update courts belonging to your club"
        )
    
    # Update fields
    for field, value in court_update.model_dump(exclude_unset=True).items():
        setattr(court, field, value)
    
    await db.commit()
    await db.refresh(court)
    
    return court


# Reservation endpoints
@router.post("/reservations", response_model=ReservationResponse)
async def create_reservation(
    reservation: ReservationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new reservation"""
    try:
        print(f"=== CREATE RESERVATION START ===")
        print(f"Reservation data: {reservation}")
        print(f"club_id: {reservation.club_id}")
        print(f"court_id: {reservation.court_id}")
        print(f"date: {reservation.date}")
        print(f"start_time: {reservation.start_time}")
        print(f"end_time: {reservation.end_time}")
        print(f"price: {reservation.price}")
        print(f"user_id from request: {reservation.user_id}")
        
        # Use user_id from request or None
        user_id = reservation.user_id
        
        # Convert date string to datetime if needed
        if isinstance(reservation.date, str):
            reservation_date = datetime.strptime(reservation.date, "%Y-%m-%d")
        else:
            reservation_date = reservation.date
        print(f"Converted date: {reservation_date}")
        
        # Check if court exists
        result = await db.execute(select(Court).where(Court.id == reservation.court_id))
        court = result.scalar_one_or_none()
        if not court:
            print(f"ERROR: Court not found with id {reservation.court_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Court not found"
            )
        print(f"Court found: {court}")
        
        # Get club data for pricing
        result = await db.execute(select(Club).where(Club.id == court.club_id))
        club = result.scalar_one_or_none()
        if not club:
            print(f"ERROR: Club not found with id {court.club_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Club not found"
            )
        print(f"Club found: {club}")
        
        # Use price from frontend (already calculated)
        price = reservation.price if reservation.price is not None else 0
        print(f"Using price from frontend: {price}")
        
        print(f"Creating reservation with price: {price}")
        db_reservation = Reservation(
            club_id=reservation.club_id,
            court_id=reservation.court_id,
            user_id=user_id,
            date=reservation_date,
            start_time=reservation.start_time,
            end_time=reservation.end_time,
            reservation_type=reservation.reservation_type or 'normal',
            price=price,
            notes=reservation.notes,
            players=reservation.players
        )
        print(f"Reservation object created: {db_reservation}")
        
        db.add(db_reservation)
        print("Reservation added to session")
        
        await db.commit()
        print("Commit successful")
        
        await db.refresh(db_reservation)
        print(f"Reservation refreshed: {db_reservation}")
        
        # Create payment participants automatically based on players
        if reservation.players:
            await _create_reservation_participants(
                db, 
                reservation.club_id, 
                db_reservation.id, 
                reservation.players, 
                price
            )
            print(f"Created payment participants for reservation {db_reservation.id}")
        
        print(f"=== CREATE RESERVATION SUCCESS ===")
        return db_reservation
    except Exception as e:
        print(f"=== CREATE RESERVATION ERROR ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Error details: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating reservation: {str(e)}"
        )


@router.get("/reservations")
async def get_reservations(db: AsyncSession = Depends(get_db)):
    """Get all reservations"""
    try:
        print("=== GET /clubs/reservations START ===")
        result = await db.execute(select(Reservation))
        reservations = result.scalars().all()
        print(f"Found {len(reservations)} reservations")
        for r in reservations:
            print(f"Reservation: id={r.id}, club_id={r.club_id}, court_id={r.court_id}, user_id={r.user_id}, date={r.date}, start_time={r.start_time}, end_time={r.end_time}")
        print("=== GET /clubs/reservations END ===")
        return reservations
    except Exception as e:
        print(f"=== GET /clubs/reservations ERROR ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Error details: {e}")
        raise


@router.get("/{club_id}/reservations-by-date")
async def get_reservations_by_date(club_id: int, date: str, db: AsyncSession = Depends(get_db)):
    """Get reservations for a specific club and date"""
    try:
        print(f"=== GET /clubs/{club_id}/reservations-by-date START ===")
        print(f"Club ID: {club_id}, Date: {date}")
        
        # Parse the date string to datetime
        from datetime import datetime
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        
        # Query reservations for the specific club and date
        result = await db.execute(
            select(Reservation)
            .where(Reservation.club_id == club_id)
            .where(func.date(Reservation.date) == date_obj.date())
        )
        reservations = result.scalars().all()
        
        print(f"Found {len(reservations)} reservations")
        for r in reservations:
            print(f"Reservation: id={r.id}, court_id={r.court_id}, date={r.date}, start_time={r.start_time}, end_time={r.end_time}")
        
        # Convert to dict to avoid Pydantic validation issues
        reservations_data = []
        for r in reservations:
            reservations_data.append({
                "id": r.id,
                "club_id": r.club_id,
                "court_id": r.court_id,
                "user_id": r.user_id,
                "date": r.date.isoformat() if r.date else None,
                "start_time": r.start_time,
                "end_time": r.end_time,
                "status": r.status,
                "reservation_type": r.reservation_type,
                "price": r.price,
                "notes": r.notes,
                "players": r.players,
                "payment_status": r.payment_status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None
            })
        
        print("=== GET /clubs/{club_id}/reservations-by-date END ===")
        return reservations_data
    except Exception as e:
        print(f"=== GET /clubs/{club_id}/reservations-by-date ERROR ===")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Error details: {e}")
        raise


@router.put("/reservations/{reservation_id}", response_model=ReservationResponse)
async def update_reservation(reservation_id: int, reservation_update: ReservationUpdate, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Update reservation (only for the authenticated club admin)"""
    result = await db.execute(select(Reservation).where(Reservation.id == reservation_id))
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    # Verify that the reservation belongs to the authenticated club
    if reservation.club_id != current_club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update reservations belonging to your club"
        )
    
    # Update fields
    for field, value in reservation_update.model_dump(exclude_unset=True).items():
        setattr(reservation, field, value)
    
    await db.commit()
    await db.refresh(reservation)
    
    return reservation


@router.delete("/reservations/{reservation_id}")
async def delete_reservation(reservation_id: int, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Delete reservation (only for the authenticated club admin)"""
    result = await db.execute(select(Reservation).where(Reservation.id == reservation_id))
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    # Verify that the reservation belongs to the authenticated club
    if reservation.club_id != current_club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete reservations belonging to your club"
        )
    
    await db.delete(reservation)
    await db.commit()
    
    return {"message": "Reservation deleted successfully"}


# Payment endpoints
@router.get("/payments")
async def get_payments(reservation_id: Optional[int] = None, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Get payments for the authenticated club, optionally filtered by reservation"""
    query = select(Payment).where(Payment.club_id == current_club.id)
    
    if reservation_id:
        query = query.where(Payment.reservation_id == reservation_id)
    
    result = await db.execute(query)
    payments = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "reservation_id": p.reservation_id,
            "player_name": p.player_name,
            "amount": float(p.amount),
            "method": p.method,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in payments
    ]


@router.post("/payments")
async def create_payment(payment_data: dict, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Create a new payment for the authenticated club"""
    reservation_id = payment_data.get("reservation_id")
    player_name = payment_data.get("player_name")
    amount = payment_data.get("amount")
    method = payment_data.get("method")
    
    if not reservation_id or not player_name or not amount or not method:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="reservation_id, player_name, amount, and method are required"
        )
    
    # Verify reservation belongs to this club
    reservation_result = await db.execute(
        select(Reservation).where(
            Reservation.id == reservation_id,
            Reservation.club_id == current_club.id
        )
    )
    reservation = reservation_result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    # Create payment
    payment = Payment(
        club_id=current_club.id,
        reservation_id=reservation_id,
        player_name=player_name,
        amount=amount,
        method=method,
        status="completed"
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    # Update reservation payment status
    await _update_reservation_payment_status(db, current_club.id, reservation_id)
    
    return {
        "id": payment.id,
        "reservation_id": payment.reservation_id,
        "player_name": payment.player_name,
        "amount": float(payment.amount),
        "method": payment.method,
        "status": payment.status
    }


async def _update_reservation_payment_status(db: AsyncSession, club_id: int, reservation_id: int):
    """Update reservation payment status based on total payments"""
    # Get reservation
    reservation_result = await db.execute(
        select(Reservation).where(
            Reservation.id == reservation_id,
            Reservation.club_id == club_id
        )
    )
    reservation = reservation_result.scalar_one_or_none()
    
    if not reservation:
        return
    
    # Get total payments for this reservation
    payments_result = await db.execute(
        select(Payment).where(
            Payment.club_id == club_id,
            Payment.reservation_id == reservation_id,
            Payment.status == "completed"
        )
    )
    payments = payments_result.scalars().all()
    
    total_paid = sum(float(p.amount) for p in payments)
    
    # Update payment status
    if total_paid >= float(reservation.price):
        reservation.payment_status = "paid"
    elif total_paid > 0:
        reservation.payment_status = "partial"
    else:
        reservation.payment_status = "unpaid"
    
    await db.commit()


# Debt endpoints
@router.get("/debts")
async def get_debts(current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Get all debts for the authenticated club"""
    result = await db.execute(select(Debt).where(Debt.club_id == current_club.id))
    debts = result.scalars().all()
    
    return [
        {
            "id": d.id,
            "user_id": d.user_id,
            "user_name": f"Usuario #{d.user_id}",  # In production, fetch actual user name
            "amount": float(d.amount),
            "description": d.description,
            "paid": d.paid,
            "paid_at": d.paid_at.isoformat() if d.paid_at else None,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in debts
    ]


@router.put("/debts/{debt_id}/pay")
async def mark_debt_paid(debt_id: int, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Mark a debt as paid (only for the authenticated club)"""
    result = await db.execute(select(Debt).where(Debt.id == debt_id, Debt.club_id == current_club.id))
    debt = result.scalar_one_or_none()
    
    if not debt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debt not found"
        )
    
    debt.paid = True
    debt.paid_at = func.now()
    
    await db.commit()
    await db.refresh(debt)
    
    return {
        "id": debt.id,
        "user_id": debt.user_id,
        "amount": float(debt.amount),
        "paid": debt.paid,
        "paid_at": debt.paid_at.isoformat() if debt.paid_at else None
    }


# Cash Register endpoints
@router.get("/cash-registers")
async def get_cash_registers(current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Get all cash registers for the authenticated club"""
    result = await db.execute(select(CashRegister).where(CashRegister.club_id == current_club.id, CashRegister.is_active == True))
    registers = result.scalars().all()
    
    return [
        {
            "id": r.id,
            "name": r.name,
            "register_type": r.register_type,
            "balance": float(r.balance),
            "is_active": r.is_active
        }
        for r in registers
    ]


@router.post("/cash-registers")
async def create_cash_register(register_data: dict, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Create a new cash register for the authenticated club"""
    register = CashRegister(
        club_id=current_club.id,
        name=register_data.get("name"),
        register_type=register_data.get("register_type"),
        balance=register_data.get("balance", 0)
    )
    
    db.add(register)
    await db.commit()
    await db.refresh(register)
    
    return {
        "id": register.id,
        "name": register.name,
        "register_type": register.register_type,
        "balance": float(register.balance),
        "is_active": register.is_active
    }


# Penalty endpoints
@router.post("/penalties/calculate")
async def calculate_penalty(penalty_data: dict, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Calculate penalty for cancelling a match or reservation"""
    from datetime import datetime, timedelta
    
    match_id = penalty_data.get("match_id")
    reservation_id = penalty_data.get("reservation_id")
    user_id = penalty_data.get("user_id")
    
    # Get match or reservation date
    if match_id:
        from matches.models import Match
        result = await db.execute(select(Match).where(Match.id == match_id))
        match = result.scalar_one_or_none()
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        # Verify match belongs to the club
        if match.club_id != current_club.id:
            raise HTTPException(status_code=403, detail="Match does not belong to your club")
        match_date = match.date
    elif reservation_id:
        result = await db.execute(select(Reservation).where(Reservation.id == reservation_id))
        reservation = result.scalar_one_or_none()
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        # Verify reservation belongs to the club
        if reservation.club_id != current_club.id:
            raise HTTPException(status_code=403, detail="Reservation does not belong to your club")
        match_date = reservation.date
    else:
        raise HTTPException(status_code=400, detail="match_id or reservation_id required")
    
    # Calculate hours before match
    now = datetime.now()
    hours_before = (match_date - now).total_seconds() / 3600
    
    # Calculate penalty percentage
    if hours_before >= 12:
        penalty_percentage = 0
    elif hours_before >= 6:
        penalty_percentage = 50  # 50% of user's share
    else:
        penalty_percentage = 100  # 100% of court cost
    
    # Calculate penalty amount
    court_cost = penalty_data.get("court_cost", 0)
    if penalty_percentage == 50:
        penalty_amount = court_cost / 4  # User's share (1/4 of court)
    else:
        penalty_amount = court_cost * (penalty_percentage / 100)
    
    return {
        "hours_before": round(hours_before, 2),
        "penalty_percentage": penalty_percentage,
        "penalty_amount": float(penalty_amount),
        "penalty_type": "late_cancellation" if hours_before < 12 else "no_penalty"
    }


@router.post("/penalties")
async def create_penalty(penalty_data: dict, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Create a penalty record for the authenticated club"""
    penalty = Penalty(
        club_id=current_club.id,
        user_id=penalty_data.get("user_id"),
        match_id=penalty_data.get("match_id"),
        reservation_id=penalty_data.get("reservation_id"),
        penalty_type=penalty_data.get("penalty_type", "late_cancellation"),
        hours_before=penalty_data.get("hours_before"),
        penalty_percentage=penalty_data.get("penalty_percentage"),
        penalty_amount=penalty_data.get("penalty_amount"),
        is_blocked=penalty_data.get("penalty_percentage", 0) > 0
    )
    
    db.add(penalty)
    await db.commit()
    await db.refresh(penalty)
    
    return {
        "id": penalty.id,
        "user_id": penalty.user_id,
        "penalty_type": penalty.penalty_type,
        "hours_before": penalty.hours_before,
        "penalty_percentage": penalty.penalty_percentage,
        "penalty_amount": float(penalty.penalty_amount),
        "is_paid": penalty.is_paid,
        "is_blocked": penalty.is_blocked,
        "created_at": penalty.created_at.isoformat()
    }


@router.get("/penalties/{user_id}")
async def get_user_penalties(user_id: int, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Get all penalties for a user in the authenticated club"""
    result = await db.execute(
        select(Penalty).where(
            Penalty.club_id == current_club.id,
            Penalty.user_id == user_id
        )
    )
    penalties = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "penalty_type": p.penalty_type,
            "hours_before": p.hours_before,
            "penalty_percentage": p.penalty_percentage,
            "penalty_amount": float(p.penalty_amount),
            "is_paid": p.is_paid,
            "is_blocked": p.is_blocked,
            "created_at": p.created_at.isoformat(),
            "paid_at": p.paid_at.isoformat() if p.paid_at else None
        }
        for p in penalties
    ]


@router.put("/penalties/{penalty_id}/pay")
async def pay_penalty(penalty_id: int, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Mark a penalty as paid (only for the authenticated club)"""
    result = await db.execute(select(Penalty).where(Penalty.id == penalty_id))
    penalty = result.scalar_one_or_none()
    
    if not penalty:
        raise HTTPException(status_code=404, detail="Penalty not found")
    
    # Verify that the penalty belongs to the authenticated club
    if penalty.club_id != current_club.id:
        raise HTTPException(
            status_code=403,
            detail="You can only pay penalties belonging to your club"
        )
    
    penalty.is_paid = True
    penalty.is_blocked = False
    penalty.paid_at = func.now()
    
    await db.commit()
    await db.refresh(penalty)
    
    return {
        "id": penalty.id,
        "is_paid": penalty.is_paid,
        "is_blocked": penalty.is_blocked,
        "paid_at": penalty.paid_at.isoformat()
    }


@router.get("/users/{user_id}/blocked")
async def check_user_blocked(user_id: int, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Check if a user is blocked due to unpaid penalties in the authenticated club"""
    result = await db.execute(
        select(Penalty).where(
            Penalty.club_id == current_club.id,
            Penalty.user_id == user_id,
            Penalty.is_blocked == True,
            Penalty.is_paid == False
        )
    )
    penalties = result.scalars().all()
    
    return {
        "is_blocked": len(penalties) > 0,
        "unpaid_penalties": len(penalties),
        "total_owed": sum(float(p.penalty_amount) for p in penalties)
    }
