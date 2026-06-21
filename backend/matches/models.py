from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base
import enum


class MatchStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    MIXED = "mixed"


class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    category = Column(String)  # Principiante, Intermedio, Avanzado
    gender = Column(SQLEnum(Gender), default=Gender.MIXED)
    status = Column(SQLEnum(MatchStatus), default=MatchStatus.PENDING)
    price = Column(Integer)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    club = relationship("Club")
    court = relationship("Court")
    invitations = relationship("MatchInvitation", back_populates="match")


class MatchInvitation(Base):
    __tablename__ = "match_invitations"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    position = Column(Integer)  # 1, 2, 3, 4
    status = Column(SQLEnum(InvitationStatus), default=InvitationStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    match = relationship("Match", back_populates="invitations")
    user = relationship("User")


class MatchRequest(Base):
    __tablename__ = "match_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    preferred_time = Column(String)
    category = Column(String)
    gender = Column(SQLEnum(Gender), default=Gender.MIXED)
    status = Column(String, default="pending")  # pending, matched, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    club = relationship("Club")
