from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String)
    address = Column(Text)
    city = Column(String)
    country = Column(String, default="Argentina")
    description = Column(Text)
    logo_url = Column(String)
    is_active = Column(Boolean, default=False)  # Changed to False - requires owner activation
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Trial period fields
    trial_start_date = Column(DateTime(timezone=True), server_default=func.now())
    trial_end_date = Column(DateTime(timezone=True))  # 30 days after start
    grace_period_end_date = Column(DateTime(timezone=True))  # 5 days after trial_end_date

    # Configuration fields
    currency = Column(String, default="USD")
    timezone = Column(String, default="America/Argentina/Buenos_Aires")

    # Pricing fields
    hourly_price = Column(Numeric(10, 2), default=200.00)
    lesson_1_player_price = Column(Numeric(10, 2))
    lesson_2_player_price = Column(Numeric(10, 2))
    lesson_3_player_price = Column(Numeric(10, 2))
    lesson_4_player_price = Column(Numeric(10, 2))

    # Operating hours
    operating_hours_start = Column(Time, default="08:00")
    operating_hours_end = Column(Time, default="22:00")

    # Relationships
    courts = relationship("Court", back_populates="club")
    users = relationship("User", back_populates="club")


class Court(Base):
    __tablename__ = "courts"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    name = Column(String, nullable=False)
    number = Column(Integer, nullable=False)
    surface = Column(String, default="Césped")  # Césped, Cemento, Sintético
    is_indoor = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    club = relationship("Club", back_populates="courts")
    reservations = relationship("Reservation", back_populates="court")


class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    start_time = Column(String, nullable=False)  # "14:00"
    end_time = Column(String, nullable=False)    # "15:00"
    status = Column(String, default="pending")   # pending, confirmed, cancelled
    price = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    club = relationship("Club")
    court = relationship("Court", back_populates="reservations")
    user = relationship("User")


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String, nullable=False)  # card, cash, transfer
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    club = relationship("Club")
    user = relationship("User")


class Debt(Base):
    __tablename__ = "debts"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    paid = Column(Boolean, default=False)
    paid_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    club = relationship("Club")
    user = relationship("User")


class CashRegister(Base):
    __tablename__ = "cash_registers"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    name = Column(String, nullable=False)  # "Caja Principal", "Caja Efectivo", "Caja Tarjeta", etc.
    register_type = Column(String, nullable=False)  # main, cash, card, transfer
    balance = Column(Numeric(10, 2), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    club = relationship("Club")


class Penalty(Base):
    __tablename__ = "penalties"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=True)
    penalty_type = Column(String, nullable=False)  # "no_show", "late_cancellation"
    hours_before = Column(Integer, nullable=False)  # hours before match
    penalty_percentage = Column(Integer, nullable=False)  # 0, 50, 100
    penalty_amount = Column(Numeric(10, 2), nullable=False)
    is_paid = Column(Boolean, default=False)
    is_blocked = Column(Boolean, default=False)  # user blocked until paid
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True))
    
    # Relationships
    club = relationship("Club")
    user = relationship("User")
    match = relationship("Match", foreign_keys=[match_id])
    reservation = relationship("Reservation", foreign_keys=[reservation_id])
