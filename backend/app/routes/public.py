from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, contains_eager
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.arena import Arena
from app.schemas.productivity import (
    YearlyProductivityResponse,
    MonthlyProductivityResponse,
    DailyProductivityResponse,
    ArenaBreakdown,
    MonthlySummary,
    YearlySummary,
)
from app.services.locking_tasks import lock_overdue_tasks
from calendar import monthrange
from datetime import date
from pydantic import BaseModel

router = APIRouter(prefix="/public", tags=["Public"])


class PublicUserResponse(BaseModel):
    first_name: str


@router.get("/{public_id}", response_model=PublicUserResponse)
def get_public_profile(public_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.public_id == public_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return {"first_name": user.first_name}


@router.get("/{public_id}/productivity/year", response_model=YearlyProductivityResponse)
def get_public_yearly_productivity(
    public_id: str,
    year: int,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.public_id == public_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    first_day = date(year, 1, 1)
    last_day = date(year, 12, 31)

    tasks = (
        db.query(Task)
        .join(Arena, Task.arena_id == Arena.id)
        .options(contains_eager(Task.arena))
        .filter(
            Task.user_id == user.id,
            Task.due_date >= first_day,
            Task.due_date <= last_day,
            Arena.is_archived == False,
        )
        .all()
    )

    tasks = lock_overdue_tasks(tasks, db)

    tasks_by_date = {}
    tasks_by_month = {m: [] for m in range(1, 13)}
    for task in tasks:
        if task.due_date:
            tasks_by_date.setdefault(task.due_date, []).append(task)
            tasks_by_month[task.due_date.month].append(task)

    daily_breakdown = []
    day_candidates = []

    for single_date, day_tasks in sorted(tasks_by_date.items()):
        total = len(day_tasks)
        completed = sum(1 for t in day_tasks if t.is_completed)
        completion_percentage = round((completed / total * 100) if total > 0 else 0, 2)
        total_hours = round(sum((t.duration or 0) for t in day_tasks if t.is_completed) / 60, 2)

        day_arena_map = {}
        for task in day_tasks:
            if task.arena:
                arena_id = task.arena.id
                if arena_id not in day_arena_map:
                    day_arena_map[arena_id] = {
                        "arena_id": arena_id,
                        "arena_name": task.arena.name,
                        "arena_color": task.arena.color,
                        "total_tasks": 0,
                        "completed_tasks": 0,
                        "total_hours": 0.0,
                    }
                day_arena_map[arena_id]["total_tasks"] += 1
                if task.is_completed:
                    day_arena_map[arena_id]["completed_tasks"] += 1
                    day_arena_map[arena_id]["total_hours"] += round((task.duration or 0) / 60, 2)

        day_arenas = []
        for arena_data in day_arena_map.values():
            t = arena_data["total_tasks"]
            c = arena_data["completed_tasks"]
            arena_data["completion_percentage"] = round((c / t * 100) if t > 0 else 0, 2)
            day_arenas.append(ArenaBreakdown(**arena_data))

        daily_breakdown.append(
            DailyProductivityResponse(
                date=single_date,
                total_tasks=total,
                completed_tasks=completed,
                completion_percentage=completion_percentage,
                total_hours=total_hours,
                arenas=day_arenas,
            )
        )
        if total > 0:
            day_candidates.append({
                "date": single_date,
                "total_tasks": total,
                "completed_tasks": completed,
                "completion_percentage": completion_percentage,
                "total_hours": total_hours,
            })

    best_day = None
    if day_candidates:
        best = max(day_candidates, key=lambda x: (x["completion_percentage"], x["total_hours"]))
        best_day = DailyProductivityResponse(**best, arenas=[])

    months = []
    month_candidates = []
    for month_num, month_tasks in tasks_by_month.items():
        total_tasks = len(month_tasks)
        completed_tasks = sum(1 for t in month_tasks if t.is_completed)
        completion_percentage = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
        total_duration_hours = round(sum((t.duration or 0) for t in month_tasks if t.is_completed) / 60, 2)
        days_with_tasks = len(set(t.due_date for t in month_tasks if t.due_date))
        average_tasks_per_day = round(total_tasks / days_with_tasks if days_with_tasks > 0 else 0, 2)
        average_duration_per_day = round(total_duration_hours / days_with_tasks if days_with_tasks > 0 else 0, 2)

        arena_map = {}
        for task in month_tasks:
            if task.arena:
                arena_id = task.arena.id
                if arena_id not in arena_map:
                    arena_map[arena_id] = {
                        "arena_id": arena_id,
                        "arena_name": task.arena.name,
                        "arena_color": task.arena.color,
                        "total_tasks": 0,
                        "completed_tasks": 0,
                        "total_hours": 0.0,
                    }
                arena_map[arena_id]["total_tasks"] += 1
                if task.is_completed:
                    arena_map[arena_id]["completed_tasks"] += 1
                    arena_map[arena_id]["total_hours"] += round((task.duration or 0) / 60, 2)

        arenas = []
        for arena_data in arena_map.values():
            t = arena_data["total_tasks"]
            c = arena_data["completed_tasks"]
            arena_data["completion_percentage"] = round((c / t * 100) if t > 0 else 0, 2)
            arenas.append(ArenaBreakdown(**arena_data))

        month_summary = MonthlySummary(
            month=month_num,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            completion_percentage=completion_percentage,
            total_duration_hours=total_duration_hours,
            average_tasks_per_day=average_tasks_per_day,
            average_duration_per_day=average_duration_per_day,
            days_with_tasks=days_with_tasks,
            arenas=arenas,
        )
        months.append(month_summary)
        if total_tasks > 0:
            month_candidates.append(month_summary)

    best_month = None
    if month_candidates:
        best_month = max(month_candidates, key=lambda x: (x.completion_percentage, x.total_duration_hours))

    yearly_arena_map = {}
    for task in tasks:
        if task.arena:
            arena_id = task.arena.id
            if arena_id not in yearly_arena_map:
                yearly_arena_map[arena_id] = {
                    "arena_id": arena_id,
                    "arena_name": task.arena.name,
                    "arena_color": task.arena.color,
                    "total_tasks": 0,
                    "completed_tasks": 0,
                    "total_hours": 0.0,
                }
            yearly_arena_map[arena_id]["total_tasks"] += 1
            if task.is_completed:
                yearly_arena_map[arena_id]["completed_tasks"] += 1
                yearly_arena_map[arena_id]["total_hours"] += round((task.duration or 0) / 60, 2)

    yearly_arenas = []
    for arena_data in yearly_arena_map.values():
        t = arena_data["total_tasks"]
        c = arena_data["completed_tasks"]
        arena_data["completion_percentage"] = round((c / t * 100) if t > 0 else 0, 2)
        yearly_arenas.append(ArenaBreakdown(**arena_data))

    total_tasks_all = len(tasks)
    completed_tasks_all = sum(1 for t in tasks if t.is_completed)
    yearly_summary = YearlySummary(
        total_tasks=total_tasks_all,
        completed_tasks=completed_tasks_all,
        completion_percentage=round((completed_tasks_all / total_tasks_all * 100) if total_tasks_all > 0 else 0, 2),
        arenas=yearly_arenas,
    )

    return YearlyProductivityResponse(
        year=year,
        summary=yearly_summary,
        daily_breakdown=daily_breakdown,
        best_day=best_day,
        best_month=best_month,
        months=months,
    )


@router.get("/{public_id}/productivity/month", response_model=MonthlyProductivityResponse)
def get_public_monthly_productivity(
    public_id: str,
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.public_id == public_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    last_day_number = monthrange(year, month)[1]
    first_day = date(year, month, 1)
    last_day = date(year, month, last_day_number)

    tasks = (
        db.query(Task)
        .join(Arena, Task.arena_id == Arena.id)
        .options(contains_eager(Task.arena))
        .filter(
            Task.user_id == user.id,
            Task.due_date >= first_day,
            Task.due_date <= last_day,
            Arena.is_archived == False,
        )
        .all()
    )

    tasks = lock_overdue_tasks(tasks, db)

    tasks_by_date = {}
    for i in range(last_day_number):
        tasks_by_date[date(year, month, i + 1)] = []
    for task in tasks:
        if task.due_date in tasks_by_date:
            tasks_by_date[task.due_date].append(task)

    daily_breakdown = []
    candidates = []

    for single_date, day_tasks in tasks_by_date.items():
        total = len(day_tasks)
        completed = sum(1 for t in day_tasks if t.is_completed)
        completion_percentage = round((completed / total * 100) if total > 0 else 0, 2)
        total_duration = round(sum((t.duration or 0) for t in day_tasks if t.is_completed) / 60, 2)

        day_arena_map = {}
        for task in day_tasks:
            if task.arena:
                arena_id = task.arena.id
                if arena_id not in day_arena_map:
                    day_arena_map[arena_id] = {
                        "arena_id": arena_id,
                        "arena_name": task.arena.name,
                        "arena_color": task.arena.color,
                        "total_tasks": 0,
                        "completed_tasks": 0,
                        "total_hours": 0.0,
                    }
                day_arena_map[arena_id]["total_tasks"] += 1
                if task.is_completed:
                    day_arena_map[arena_id]["completed_tasks"] += 1
                    day_arena_map[arena_id]["total_hours"] += round((task.duration or 0) / 60, 2)

        day_arenas = []
        for arena_data in day_arena_map.values():
            t = arena_data["total_tasks"]
            c = arena_data["completed_tasks"]
            arena_data["completion_percentage"] = round((c / t * 100) if t > 0 else 0, 2)
            day_arenas.append(ArenaBreakdown(**arena_data))

        daily_breakdown.append(
            DailyProductivityResponse(
                date=single_date,
                total_tasks=total,
                completed_tasks=completed,
                completion_percentage=completion_percentage,
                total_hours=total_duration,
                arenas=day_arenas,
            )
        )
        if total > 0:
            candidates.append({
                "date": single_date,
                "total_tasks": total,
                "completed_tasks": completed,
                "completion_percentage": completion_percentage,
                "total_hours": total_duration,
            })

    most_productive_day = None
    if candidates:
        best = max(candidates, key=lambda x: (x["completion_percentage"], x["total_hours"]))
        most_productive_day = DailyProductivityResponse(**best, arenas=[])

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.is_completed)
    completion_percentage = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
    total_duration_hours = round(sum((t.duration or 0) for t in tasks if t.is_completed) / 60, 2)
    days_with_tasks = sum(1 for dt in tasks_by_date.values() if len(dt) > 0)
    average_tasks_per_day = round(total_tasks / days_with_tasks if days_with_tasks > 0 else 0, 2)
    average_duration_per_day = round(total_duration_hours / days_with_tasks if days_with_tasks > 0 else 0, 2)

    arena_map = {}
    for task in tasks:
        if task.arena:
            arena_id = task.arena.id
            if arena_id not in arena_map:
                arena_map[arena_id] = {
                    "arena_id": arena_id,
                    "arena_name": task.arena.name,
                    "arena_color": task.arena.color,
                    "total_tasks": 0,
                    "completed_tasks": 0,
                    "total_hours": 0.0,
                }
            arena_map[arena_id]["total_tasks"] += 1
            if task.is_completed:
                arena_map[arena_id]["completed_tasks"] += 1
                arena_map[arena_id]["total_hours"] += round((task.duration or 0) / 60, 2)

    arenas = []
    for arena_data in arena_map.values():
        t = arena_data["total_tasks"]
        c = arena_data["completed_tasks"]
        arena_data["completion_percentage"] = round((c / t * 100) if t > 0 else 0, 2)
        arenas.append(ArenaBreakdown(**arena_data))

    summary = MonthlySummary(
        month=month,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completion_percentage=completion_percentage,
        total_duration_hours=total_duration_hours,
        average_tasks_per_day=average_tasks_per_day,
        average_duration_per_day=average_duration_per_day,
        days_with_tasks=days_with_tasks,
        arenas=arenas,
    )

    return MonthlyProductivityResponse(
        year=year,
        month=month,
        summary=summary,
        most_productive_day=most_productive_day,
        daily_breakdown=daily_breakdown,
    )
