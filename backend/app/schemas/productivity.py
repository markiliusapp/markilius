from pydantic import BaseModel
from datetime import date
from typing import Optional


class DailyProductivityResponse(BaseModel):
    date: date
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    high_priority_tasks: int
    low_priority_tasks: int
    high_priority_completed: int
    low_priority_completed: int
    high_priority_completion_percentage: float
    low_priority_completion_percentage: float
    total_hours: float
    high_priority_hours: float
    low_priority_hours: float


class DailyBreakdown(BaseModel):
    date: date
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    total_duration: float


class MonthlySummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    total_duration_hours: float
    average_tasks_per_day: float
    average_duration_per_day: float
    days_with_tasks: int


class MonthlyProductivityResponse(BaseModel):
    year: int
    month: int
    summary: MonthlySummary
    most_productive_day: Optional[DailyBreakdown] = None
    daily_breakdown: list[DailyBreakdown]
