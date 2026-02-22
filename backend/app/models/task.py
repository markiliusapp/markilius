from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Date,
    TIMESTAMP,
    ForeignKey,
)
from sqlalchemy.sql import func
from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    frequency = Column(
        String(20), nullable=True
    )  # 'once', 'daily', 'weekly', 'monthly'
    priority = Column(
        Boolean, nullable=False, default=False
    )  # True = high, False = low
    duration = Column(Integer, nullable=True)  # estimated duration in minutes
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    due_date = Column(Date, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
