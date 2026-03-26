from pydantic import BaseModel
from datetime import date
from typing import Optional
from app.schemas.task import TaskResponse


class ArenaBreakdown(BaseModel):
    arena_id: int
    arena_name: str
    arena_color: str
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    total_hours: float


class DailyProductivityResponse(BaseModel):
    date: date
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    total_hours: float
    active_hours: float = 0.0
    arenas: list[ArenaBreakdown]


class MonthlySummary(BaseModel):
    month: int
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    total_duration_hours: float
    average_tasks_per_day: float
    average_duration_per_day: float
    days_with_tasks: int
    arenas: list[ArenaBreakdown]


class MonthlyProductivityResponse(BaseModel):
    year: int
    month: int
    summary: MonthlySummary
    most_productive_day: Optional[DailyProductivityResponse] = None
    daily_breakdown: list[DailyProductivityResponse]


class DailyBreakDownWithTasks(BaseModel):
    date: date
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    total_duration: float
    completed: list[TaskResponse]
    incomplete: list[TaskResponse]
    arenas: list[ArenaBreakdown]


class WeeklySummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    total_duration_hours: float
    average_tasks_per_day: float
    average_duration_per_day: float
    days_with_tasks: int
    arenas: list[ArenaBreakdown]


class WeeklyProductivityResponse(BaseModel):
    start_date: date
    end_date: date
    summary: WeeklySummary
    most_productive_day: Optional[DailyProductivityResponse] = None
    daily_breakdown: list[DailyBreakDownWithTasks]


class YearlySummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    arenas: list[ArenaBreakdown]


class YearlyProductivityResponse(BaseModel):
    year: int
    summary: YearlySummary
    daily_breakdown: list[DailyProductivityResponse]
    best_day: Optional[DailyProductivityResponse] = None
    best_month: Optional[MonthlySummary] = None
    months: list[MonthlySummary]


class ArenaStreakResponse(BaseModel):
    arena_id: int
    arena_name: str
    arena_color: str
    current_streak: int
    longest_streak: int


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    arenas: list[ArenaStreakResponse]
