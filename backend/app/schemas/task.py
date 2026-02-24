from app.models.task import Task
from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import date, datetime


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
    priority: bool
    duration: Optional[int] = None
    due_date: date


class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    frequency: str
    priority: bool
    duration: Optional[int]
    created_at: datetime
    due_date: date
    is_completed: bool
    is_locked: bool

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[FrequencyType] = None
    priority: Optional[bool] = None
    duration: Optional[int] = None
    due_date: Optional[date] = None
