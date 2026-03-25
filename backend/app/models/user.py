from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(100), nullable=False)
    created_at = Column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    # Password reset fields
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(TIMESTAMP(timezone=True), nullable=True)

    # Email verification fields
    is_verified = Column(Boolean, nullable=False, default=False)
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(TIMESTAMP(timezone=True), nullable=True)

    # Public profile fields
    public_id = Column(String(36), nullable=True, unique=True, index=True)

    # Email preferences
    weekly_email = Column(Boolean, nullable=False, default=True)
    monthly_email = Column(Boolean, nullable=False, default=True)
    timezone = Column(String(100), nullable=False, default="UTC")
    last_weekly_email_sent = Column(TIMESTAMP(timezone=True), nullable=True)
    last_monthly_email_sent = Column(TIMESTAMP(timezone=True), nullable=True)

    # Onboarding
    onboarding_completed = Column(Boolean, nullable=False, default=False)

    # Subscription fields
    subscription_status = Column(String(20), nullable=False, default="inactive")  # inactive | active | lifetime
    subscription_tier = Column(String(20), nullable=True)  # monthly | yearly | lifetime
    stripe_customer_id = Column(String(100), nullable=True, unique=True)
    stripe_subscription_id = Column(String(100), nullable=True)

    arenas = relationship("Arena", back_populates="user")
