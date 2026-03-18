from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ArenaCreate(BaseModel):
    name: str
    color: str = "#f97316"


class ArenaUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class ArenaColorUpdate(BaseModel):
    color: str


class ArenaResponse(BaseModel):
    id: int
    name: str
    color: str
    is_archived: bool
    created_at: datetime

    class Config:
        from_attributes = True
