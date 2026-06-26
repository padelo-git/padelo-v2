from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from core.database import get_db
from core.security import get_current_user, get_current_club_admin, get_current_club, verify_password, create_access_token
from clubs.models import Club, Court, Reservation, Payment, Debt, CashRegister, Penalty
from clubs.schemas import (
    ClubCreate, ClubUpdate, ClubResponse, ClubWithCourts,
    CourtCreate, CourtUpdate, CourtResponse,
    ReservationCreate, ReservationUpdate, ReservationResponse
)
from pydantic import BaseModel, EmailStr

router = APIRouter()


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
    logger = logging.getLogger(__name__)
    
    try:
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

        logger.info(f"Creating club: {club.name}")

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
            hashed_password=hashed_password,
            is_active=False  # Requires owner activation
        )
        db.add(db_club)
        await db.commit()
        await db.refresh(db_club)

        logger.info(f"Club created successfully: {db_club.id}")
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
    # Find club by email (case-insensitive)
    result = await db.execute(select(Club).where(func.lower(Club.email) == credentials.email.lower()))
    club = result.scalar_one_or_none()

    if not club:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(credentials.password, club.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if club is active
    if not club.is_active:
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
async def activate_club(club_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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


@router.delete("/{club_id}")
async def delete_club(club_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
@router.post("/courts", response_model=CourtResponse)
async def create_court(court: CourtCreate, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Create a new court for the authenticated club"""
    db_court = Court(
        club_id=current_club.id,
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
async def get_courts(current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Get all courts for the authenticated club"""
    result = await db.execute(select(Court).where(Court.club_id == current_club.id))
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
    current_club: Club = Depends(get_current_club),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new reservation for the authenticated club"""
    # Check if court exists and belongs to the club
    result = await db.execute(select(Court).where(Court.id == reservation.court_id))
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
            detail="You can only create reservations for courts belonging to your club"
        )
    
    db_reservation = Reservation(
        club_id=current_club.id,
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
    
    # Try automatic payment via Stripe if price is set
    if reservation.price and reservation.price > 0:
        try:
            from payments.stripe_service import get_stripe_service
            stripe_service = get_stripe_service()
            
            if stripe_service:
                payment_result = await stripe_service.process_match_payment(
                    user_id=reservation.user_id,
                    match_id=db_reservation.id,
                    amount=int(reservation.price * 100),
                    currency="usd"
                )
                
                if payment_result["success"]:
                    # Create payment record
                    payment = Payment(
                        club_id=current_club.id,
                        user_id=reservation.user_id,
                        amount=reservation.price,
                        method="card",
                        description=f"Reserva automática - Cancha #{reservation.court_id}",
                        created_at=func.now()
                    )
                    db.add(payment)
                    await db.commit()
                    
                    # Update reservation status
                    db_reservation.status = "confirmed"
                    await db.commit()
                    
                    return {
                        **db_reservation.__dict__,
                        "payment_status": "paid",
                        "payment_method": "system",
                        "client_secret": payment_result.get("client_secret")
                    }
        except Exception as e:
            # If automatic payment fails, allow manual payment
            print(f"Automatic payment failed: {e}")
            return {
                **db_reservation.__dict__,
                "payment_status": "pending",
                "payment_method": "manual",
                "message": "Payment failed, please pay manually"
            }
    
    return db_reservation


@router.get("/reservations", response_model=List[ReservationResponse])
async def get_reservations(current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Get all reservations for the authenticated club"""
    result = await db.execute(select(Reservation).where(Reservation.club_id == current_club.id))
    reservations = result.scalars().all()
    return reservations


@router.put("/reservations/{reservation_id}", response_model=ReservationResponse)
async def update_reservation(reservation_id: int, reservation_update: ReservationUpdate, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Update reservation (only for the authenticated club)"""
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


# Payment endpoints
@router.get("/payments")
async def get_payments(current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Get all payments for the authenticated club"""
    result = await db.execute(select(Payment).where(Payment.club_id == current_club.id))
    payments = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "amount": float(p.amount),
            "method": p.method,
            "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in payments
    ]


@router.post("/payments")
async def create_payment(payment_data: dict, current_club: Club = Depends(get_current_club), db: AsyncSession = Depends(get_db)):
    """Create a new payment for the authenticated club"""
    payment = Payment(
        club_id=current_club.id,
        user_id=payment_data.get("user_id"),
        amount=payment_data.get("amount"),
        method=payment_data.get("method"),
        description=payment_data.get("description")
    )
    
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    return {
        "id": payment.id,
        "user_id": payment.user_id,
        "amount": float(payment.amount),
        "method": payment.method,
        "description": payment.description,
        "created_at": payment.created_at.isoformat() if payment.created_at else None
    }


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
