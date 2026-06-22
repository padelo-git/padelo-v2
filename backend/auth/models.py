from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OWNER = "owner"
    PLAYER = "player"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.PLAYER, nullable=False)
    is_club_admin = Column(Boolean, default=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    club = relationship("Club", back_populates="users")
