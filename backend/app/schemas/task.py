from app.models.task import Task
from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import date, datetime
from app.schemas.arena import ArenaResponse


class FrequencyType(str, Enum):
    once = "once"
    daily = "daily"
    saturday = "saturday"
    sunday = "sunday"
    weekends = "weekends"
    monthly = "monthly"


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    frequency: FrequencyType
    duration: Optional[int] = None
    due_date: date
    arena_id: int


class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    frequency: str
    duration: Optional[int] = None
    created_at: datetime
    due_date: date
    is_completed: bool
    is_locked: bool
    group_id: Optional[str] = None
    arena: ArenaResponse

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[FrequencyType] = None
    duration: Optional[int] = None
    due_date: Optional[date] = None
    arena_id: Optional[int] = None
