from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token, get_current_user
from core.config import settings
from auth.models import User
from clubs.models import Club
from auth.schemas import UserCreate, UserLogin, UserResponse, Token, ClubCreate, ClubLogin, ClubResponse

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user and return access token"""
    # Get user
    result = await db.execute(select(User).where(User.email == user_credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_endpoint(current_user: User = Depends(get_current_user)):
    """Get current user from token"""
    return current_user


@router.post("/forgot-password")
async def forgot_password(email_data: dict, db: AsyncSession = Depends(get_db)):
    """Send password reset email"""
    email = email_data.get("email")
    
    # Check if user exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        # Don't reveal if user exists for security
        return {"message": "If email exists, password reset link sent"}
    
    # Generate reset token (in production, use proper token generation)
    import secrets
    reset_token = secrets.token_urlsafe(32)
    
    # Store token (in production, store in database with expiration)
    # For now, just return the token for testing
    reset_link = f"https://nexasist.com/reset-password?token={reset_token}"
    
    # In production, send email with reset_link
    # For now, return the link for testing
    return {
        "message": "Password reset link sent",
        "reset_link": reset_link,
        "reset_token": reset_token
    }


@router.post("/reset-password")
async def reset_password(reset_data: dict, db: AsyncSession = Depends(get_db)):
    """Reset password with token"""
    token = reset_data.get("token")
    new_password = reset_data.get("new_password")
    
    # In production, validate token from database
    # For now, just find user by email (simplified)
    email = reset_data.get("email")
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    await db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/club/register", response_model=ClubResponse)
async def register_club(club: ClubCreate, db: AsyncSession = Depends(get_db)):
    """Register a new club"""
    # Check if club already exists
    result = await db.execute(select(Club).where(Club.email == club.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    result = await db.execute(select(Club).where(Club.slug == club.slug))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already taken"
        )
    
    # Create new club
    hashed_password = get_password_hash(club.password)
    db_club = Club(
        name=club.name,
        slug=club.slug,
        email=club.email,
        hashed_password=hashed_password
    )
    db.add(db_club)
    await db.commit()
    await db.refresh(db_club)
    
    return db_club


@router.post("/club/login", response_model=Token)
async def login_club(club_credentials: ClubLogin, db: AsyncSession = Depends(get_db)):
    """Login club and return access token"""
    # Get club
    result = await db.execute(select(Club).where(Club.email == club_credentials.email))
    club = result.scalar_one_or_none()
    
    if not club or not verify_password(club_credentials.password, club.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not club.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive club"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": club.email, "club_id": club.id, "is_club": True},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
