from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy import func
from app.database import Base


class Arena(Base):
    __tablename__ = "arenas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False, default="#f97316")
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="arenas")
    tasks = relationship("Task", back_populates="arena")
