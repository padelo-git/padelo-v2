from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from core.database import get_db
from matches.models import Match, MatchInvitation, MatchRequest
from matches.schemas import (
    MatchCreate, MatchUpdate, MatchResponse, MatchWithInvitations,
    MatchInvitationCreate, MatchInvitationUpdate, MatchInvitationResponse,
    MatchRequestCreate, MatchRequestUpdate, MatchRequestResponse
)

router = APIRouter()


# Match endpoints
@router.post("/", response_model=MatchResponse)
async def create_match(match: MatchCreate, db: AsyncSession = Depends(get_db)):
    """Create a new match"""
    db_match = Match(
        club_id=match.club_id,
        court_id=match.court_id,
        date=match.date,
        start_time=match.start_time,
        end_time=match.end_time,
        category=match.category,
        gender=match.gender,
        price=match.price,
        created_by=match.created_by
    )
    db.add(db_match)
    await db.commit()
    await db.refresh(db_match)
    
    return db_match


@router.get("/", response_model=List[MatchResponse])
async def get_matches(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Get all matches"""
    result = await db.execute(select(Match).offset(skip).limit(limit))
    matches = result.scalars().all()
    return matches


@router.get("/{match_id}", response_model=MatchWithInvitations)
async def get_match(match_id: int, db: AsyncSession = Depends(get_db)):
    """Get match by ID with invitations"""
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Get invitations
    invitations_result = await db.execute(
        select(MatchInvitation).where(MatchInvitation.match_id == match_id)
    )
    invitations = invitations_result.scalars().all()
    
    return MatchWithInvitations(
        **match.__dict__,
        invitations=invitations
    )


@router.put("/{match_id}", response_model=MatchResponse)
async def update_match(match_id: int, match_update: MatchUpdate, db: AsyncSession = Depends(get_db)):
    """Update match"""
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Update fields
    for field, value in match_update.model_dump(exclude_unset=True).items():
        setattr(match, field, value)
    
    await db.commit()
    await db.refresh(match)
    
    return match


# Match Invitation endpoints
@router.post("/{match_id}/invitations", response_model=MatchInvitationResponse)
async def create_invitation(match_id: int, invitation: MatchInvitationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new match invitation"""
    # Check if match exists
    result = await db.execute(select(Match).where(Match.id == match_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    db_invitation = MatchInvitation(
        match_id=match_id,
        user_id=invitation.user_id,
        position=invitation.position
    )
    db.add(db_invitation)
    await db.commit()
    await db.refresh(db_invitation)
    
    return db_invitation


@router.get("/{match_id}/invitations", response_model=List[MatchInvitationResponse])
async def get_invitations(match_id: int, db: AsyncSession = Depends(get_db)):
    """Get all invitations for a match"""
    result = await db.execute(
        select(MatchInvitation).where(MatchInvitation.match_id == match_id)
    )
    invitations = result.scalars().all()
    return invitations


@router.put("/invitations/{invitation_id}", response_model=MatchInvitationResponse)
async def update_invitation(invitation_id: int, invitation_update: MatchInvitationUpdate, db: AsyncSession = Depends(get_db)):
    """Update invitation status"""
    result = await db.execute(select(MatchInvitation).where(MatchInvitation.id == invitation_id))
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Update fields
    for field, value in invitation_update.model_dump(exclude_unset=True).items():
        setattr(invitation, field, value)
    
    await db.commit()
    await db.refresh(invitation)
    
    return invitation


# Match Request endpoints
@router.post("/requests", response_model=MatchRequestResponse)
async def create_match_request(request: MatchRequestCreate, db: AsyncSession = Depends(get_db)):
    """Create a new match request (I want to play)"""
    db_request = MatchRequest(
        user_id=request.user_id,
        club_id=request.club_id,
        date=request.date,
        preferred_time=request.preferred_time,
        category=request.category,
        gender=request.gender
    )
    db.add(db_request)
    await db.commit()
    await db.refresh(db_request)
    
    return db_request


@router.get("/requests", response_model=List[MatchRequestResponse])
async def get_match_requests(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Get all match requests"""
    result = await db.execute(select(MatchRequest).offset(skip).limit(limit))
    requests = result.scalars().all()
    return requests


@router.get("/requests/{request_id}", response_model=MatchRequestResponse)
async def get_match_request(request_id: int, db: AsyncSession = Depends(get_db)):
    """Get match request by ID"""
    result = await db.execute(select(MatchRequest).where(MatchRequest.id == request_id))
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match request not found"
        )
    
    return request


@router.put("/requests/{request_id}", response_model=MatchRequestResponse)
async def update_match_request(request_id: int, request_update: MatchRequestUpdate, db: AsyncSession = Depends(get_db)):
    """Update match request"""
    result = await db.execute(select(MatchRequest).where(MatchRequest.id == request_id))
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match request not found"
        )
    
    # Update fields
    for field, value in request_update.model_dump(exclude_unset=True).items():
        setattr(request, field, value)
    
    await db.commit()
    await db.refresh(request)
    
    return request
