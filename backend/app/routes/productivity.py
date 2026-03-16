from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.productivity import (
    DailyProductivityResponse,
    MonthlyProductivityResponse,
    WeeklyProductivityResponse,
    YearlyProductivityResponse,
    ArenaBreakdown,
    DailyBreakDownWithTasks,
    WeeklySummary,
    MonthlySummary,
    YearlySummary,
    ArenaStreakResponse,
    StreakResponse,
)

from datetime import date, timedelta
from app.models.user import User
from app.utils.auth import get_current_user, get_db
from sqlalchemy.orm import Session, joinedload
from app.models.task import Task
from sqlalchemy import func
from calendar import monthrange
from app.services.locking_tasks import lock_overdue_tasks
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from fastapi import HTTPException, status


router = APIRouter(prefix="/productivity", tags=["Productivity"])


@router.get("/day", response_model=DailyProductivityResponse)
def get_daily_productivity(
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = (
        db.query(Task)
        .options(joinedload(Task.arena))
        .filter(
            Task.user_id == current_user.id,
            Task.due_date == target_date,
        )
        .all()
    )

    tasks = lock_overdue_tasks(tasks, db)

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.is_completed)
    completion_percentage = (
        round((completed_tasks / total_tasks * 100), 2)
        if total_tasks > 0
        else 0
    )
    total_hours = sum((t.duration or 0) for t in tasks if t.is_completed) / 60

    # Arena breakdown
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
                arena_map[arena_id]["total_hours"] += (task.duration or 0) / 60

    arenas = []
    for arena_data in arena_map.values():
        total = arena_data["total_tasks"]
        completed = arena_data["completed_tasks"]
        arena_data["completion_percentage"] = (
            round((completed / total * 100), 2) if total > 0 else 0
        )
        arenas.append(ArenaBreakdown(**arena_data))

    return DailyProductivityResponse(
        date=target_date,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completion_percentage=round(completion_percentage, 1),
        total_hours=round(total_hours, 2),
        arenas=arenas,
    )


@router.get("/week", response_model=WeeklyProductivityResponse)
def get_weekly_productivity(
    start_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    end_date = start_date + timedelta(days=6)

    tasks = (
        db.query(Task)
        .options(joinedload(Task.arena))
        .filter(
            Task.user_id == current_user.id,
            Task.due_date >= start_date,
            Task.due_date <= end_date,
        )
        .all()
    )

    tasks = lock_overdue_tasks(tasks, db)

    # Group tasks by date
    tasks_by_date = {}
    for single_date in (start_date + timedelta(days=i) for i in range(7)):
        tasks_by_date[single_date] = []
    for task in tasks:
        if task.due_date in tasks_by_date:
            tasks_by_date[task.due_date].append(task)

    # Build daily breakdown
    daily_breakdown = []
    candidates = []

    for single_date, day_tasks in tasks_by_date.items():
        total = len(day_tasks)
        completed = sum(1 for t in day_tasks if t.is_completed)
        completion_percentage = round(
            (completed / total * 100) if total > 0 else 0, 2
        )
        total_duration = round(
            sum((t.duration or 0) for t in day_tasks if t.is_completed) / 60, 2
        )

        # Arena breakdown per day
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
                    day_arena_map[arena_id]["total_hours"] += round(
                        (task.duration or 0) / 60, 2
                    )

        day_arenas = []
        for arena_data in day_arena_map.values():
            t = arena_data["total_tasks"]
            c = arena_data["completed_tasks"]
            arena_data["completion_percentage"] = round(
                (c / t * 100) if t > 0 else 0, 2
            )
            day_arenas.append(ArenaBreakdown(**arena_data))

        completed_tasks_list = [t for t in day_tasks if t.is_completed]
        incomplete_tasks_list = [t for t in day_tasks if not t.is_completed]

        daily_breakdown.append(
            DailyBreakDownWithTasks(
                date=single_date,
                total_tasks=total,
                completed_tasks=completed,
                completion_percentage=completion_percentage,
                total_duration=total_duration,
                completed=completed_tasks_list,
                incomplete=incomplete_tasks_list,
                arenas=day_arenas,
            )
        )

        if total > 0:
            candidates.append(
                {
                    "date": single_date,
                    "total_tasks": total,
                    "completed_tasks": completed,
                    "completion_percentage": completion_percentage,
                    "total_hours": total_duration,
                }
            )

    # Most productive day with duration as tiebreaker
    most_productive_day = None
    if candidates:
        best = candidates[0]
        for candidate in candidates[1:]:
            if (
                candidate["completion_percentage"]
                > best["completion_percentage"]
            ):
                best = candidate
            elif (
                candidate["completion_percentage"]
                == best["completion_percentage"]
            ):
                if candidate["total_hours"] > best["total_hours"]:
                    best = candidate
        most_productive_day = DailyProductivityResponse(**best, arenas=[])

    # Weekly summary stats
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.is_completed)
    completion_percentage = round(
        (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2
    )
    total_duration_hours = round(
        sum((t.duration or 0) for t in tasks if t.is_completed) / 60, 2
    )
    days_with_tasks = sum(
        1 for day_tasks in tasks_by_date.values() if len(day_tasks) > 0
    )
    average_tasks_per_day = round(
        total_tasks / days_with_tasks if days_with_tasks > 0 else 0, 2
    )
    average_duration_per_day = round(
        total_duration_hours / days_with_tasks if days_with_tasks > 0 else 0, 2
    )

    # Arena breakdown for weekly summary
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
                arena_map[arena_id]["total_hours"] += round(
                    (task.duration or 0) / 60, 2
                )

    arenas = []
    for arena_data in arena_map.values():
        total = arena_data["total_tasks"]
        completed = arena_data["completed_tasks"]
        arena_data["completion_percentage"] = round(
            (completed / total * 100) if total > 0 else 0, 2
        )
        arenas.append(ArenaBreakdown(**arena_data))

    summary = WeeklySummary(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completion_percentage=completion_percentage,
        total_duration_hours=total_duration_hours,
        average_tasks_per_day=average_tasks_per_day,
        average_duration_per_day=average_duration_per_day,
        days_with_tasks=days_with_tasks,
        arenas=arenas,
    )

    return WeeklyProductivityResponse(
        start_date=start_date,
        end_date=end_date,
        summary=summary,
        most_productive_day=most_productive_day,
        daily_breakdown=daily_breakdown,
    )


@router.get("/month", response_model=MonthlyProductivityResponse)
def get_monthly_productivity(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    first_day = date(year, month, 1)
    last_day_number = monthrange(year, month)[1]
    last_day = date(year, month, last_day_number)

    tasks = (
        db.query(Task)
        .options(joinedload(Task.arena))
        .filter(
            Task.user_id == current_user.id,
            Task.due_date >= first_day,
            Task.due_date <= last_day,
        )
        .all()
    )

    tasks = lock_overdue_tasks(tasks, db)

    # Group tasks by date
    tasks_by_date = {}
    for i in range(last_day_number):
        tasks_by_date[date(year, month, i + 1)] = []
    for task in tasks:
        if task.due_date in tasks_by_date:
            tasks_by_date[task.due_date].append(task)

    # Build daily breakdown
    daily_breakdown = []
    candidates = []

    for single_date, day_tasks in tasks_by_date.items():
        total = len(day_tasks)
        completed = sum(1 for t in day_tasks if t.is_completed)
        completion_percentage = round(
            (completed / total * 100) if total > 0 else 0, 2
        )
        total_duration = round(
            sum((t.duration or 0) for t in day_tasks if t.is_completed) / 60, 2
        )

        # Arena breakdown per day
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
                    day_arena_map[arena_id]["total_hours"] += round(
                        (task.duration or 0) / 60, 2
                    )

        day_arenas = []
        for arena_data in day_arena_map.values():
            t = arena_data["total_tasks"]
            c = arena_data["completed_tasks"]
            arena_data["completion_percentage"] = round(
                (c / t * 100) if t > 0 else 0, 2
            )
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
            candidates.append(
                {
                    "date": single_date,
                    "total_tasks": total,
                    "completed_tasks": completed,
                    "completion_percentage": completion_percentage,
                    "total_hours": total_duration,
                }
            )

    # Most productive day with duration as tiebreaker
    most_productive_day = None
    if candidates:
        best = candidates[0]
        for candidate in candidates[1:]:
            if (
                candidate["completion_percentage"]
                > best["completion_percentage"]
            ):
                best = candidate
            elif (
                candidate["completion_percentage"]
                == best["completion_percentage"]
            ):
                if candidate["total_hours"] > best["total_hours"]:
                    best = candidate
        most_productive_day = DailyProductivityResponse(**best, arenas=[])

    # Monthly summary stats
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.is_completed)
    completion_percentage = round(
        (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2
    )
    total_duration_hours = round(
        sum((t.duration or 0) for t in tasks if t.is_completed) / 60, 2
    )
    days_with_tasks = sum(
        1 for day_tasks in tasks_by_date.values() if len(day_tasks) > 0
    )
    average_tasks_per_day = round(
        total_tasks / days_with_tasks if days_with_tasks > 0 else 0, 2
    )
    average_duration_per_day = round(
        total_duration_hours / days_with_tasks if days_with_tasks > 0 else 0, 2
    )

    # Arena breakdown for summary
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
                arena_map[arena_id]["total_hours"] += round(
                    (task.duration or 0) / 60, 2
                )

    arenas = []
    for arena_data in arena_map.values():
        total = arena_data["total_tasks"]
        completed = arena_data["completed_tasks"]
        arena_data["completion_percentage"] = round(
            (completed / total * 100) if total > 0 else 0, 2
        )
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


@router.get("/year", response_model=YearlyProductivityResponse)
def get_yearly_productivity(
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    first_day = date(year, 1, 1)
    last_day = date(year, 12, 31)

    tasks = (
        db.query(Task)
        .options(joinedload(Task.arena))
        .filter(
            Task.user_id == current_user.id,
            Task.due_date >= first_day,
            Task.due_date <= last_day,
        )
        .all()
    )

    tasks = lock_overdue_tasks(tasks, db)

    # Group tasks by date and month
    tasks_by_date = {}
    tasks_by_month = {m: [] for m in range(1, 13)}

    for task in tasks:
        if task.due_date:
            tasks_by_date.setdefault(task.due_date, []).append(task)
            tasks_by_month[task.due_date.month].append(task)

    # Daily breakdown
    daily_breakdown = []
    day_candidates = []

    for single_date, day_tasks in sorted(tasks_by_date.items()):
        total = len(day_tasks)
        completed = sum(1 for t in day_tasks if t.is_completed)
        completion_percentage = round(
            (completed / total * 100) if total > 0 else 0, 2
        )
        total_hours = round(
            sum((t.duration or 0) for t in day_tasks if t.is_completed) / 60, 2
        )

        # Arena breakdown per day
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
                    day_arena_map[arena_id]["total_hours"] += round(
                        (task.duration or 0) / 60, 2
                    )

        day_arenas = []
        for arena_data in day_arena_map.values():
            t = arena_data["total_tasks"]
            c = arena_data["completed_tasks"]
            arena_data["completion_percentage"] = round(
                (c / t * 100) if t > 0 else 0, 2
            )
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
            day_candidates.append(
                {
                    "date": single_date,
                    "total_tasks": total,
                    "completed_tasks": completed,
                    "completion_percentage": completion_percentage,
                    "total_hours": total_hours,
                }
            )

    # Best day
    best_day = None
    if day_candidates:
        best = day_candidates[0]
        for candidate in day_candidates[1:]:
            if (
                candidate["completion_percentage"]
                > best["completion_percentage"]
            ):
                best = candidate
            elif (
                candidate["completion_percentage"]
                == best["completion_percentage"]
            ):
                if candidate["total_hours"] > best["total_hours"]:
                    best = candidate
        best_day = DailyProductivityResponse(**best, arenas=[])

    # Monthly summaries
    months = []
    month_candidates = []

    for month_num, month_tasks in tasks_by_month.items():
        total_tasks = len(month_tasks)
        completed_tasks = sum(1 for t in month_tasks if t.is_completed)
        completion_percentage = round(
            (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2
        )
        total_duration_hours = round(
            sum((t.duration or 0) for t in month_tasks if t.is_completed) / 60,
            2,
        )
        days_with_tasks = len(
            set(t.due_date for t in month_tasks if t.due_date)
        )
        average_tasks_per_day = round(
            total_tasks / days_with_tasks if days_with_tasks > 0 else 0, 2
        )
        average_duration_per_day = round(
            (
                total_duration_hours / days_with_tasks
                if days_with_tasks > 0
                else 0
            ),
            2,
        )

        # Arena breakdown per month
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
                    arena_map[arena_id]["total_hours"] += round(
                        (task.duration or 0) / 60, 2
                    )

        arenas = []
        for arena_data in arena_map.values():
            t = arena_data["total_tasks"]
            c = arena_data["completed_tasks"]
            arena_data["completion_percentage"] = round(
                (c / t * 100) if t > 0 else 0, 2
            )
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

    # Best month
    best_month = None
    if month_candidates:
        best = month_candidates[0]
        for candidate in month_candidates[1:]:
            if candidate.completion_percentage > best.completion_percentage:
                best = candidate
            elif candidate.completion_percentage == best.completion_percentage:
                if candidate.total_duration_hours > best.total_duration_hours:
                    best = candidate
        best_month = best

    # Yearly summary arena breakdown
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
                yearly_arena_map[arena_id]["total_hours"] += round(
                    (task.duration or 0) / 60, 2
                )

    yearly_arenas = []
    for arena_data in yearly_arena_map.values():
        t = arena_data["total_tasks"]
        c = arena_data["completed_tasks"]
        arena_data["completion_percentage"] = round(
            (c / t * 100) if t > 0 else 0, 2
        )
        yearly_arenas.append(ArenaBreakdown(**arena_data))

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.is_completed)
    completion_percentage = round(
        (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2
    )

    summary = YearlySummary(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completion_percentage=completion_percentage,
        arenas=yearly_arenas,
    )

    return YearlyProductivityResponse(
        year=year,
        summary=summary,
        daily_breakdown=daily_breakdown,
        best_day=best_day,
        best_month=best_month,
        months=months,
    )


@router.get("/streaks", response_model=StreakResponse)
def get_streaks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = (
        db.query(Task)
        .options(joinedload(Task.arena))
        .filter(Task.user_id == current_user.id)
        .order_by(Task.due_date)
        .all()
    )

    # Group tasks by date
    tasks_by_date: dict[date, list[Task]] = {}
    for task in tasks:
        if task.due_date:
            tasks_by_date.setdefault(task.due_date, []).append(task)

    # Group tasks by date per arena
    tasks_by_date_by_arena: dict[int, dict[date, list[Task]]] = {}
    for task in tasks:
        if task.arena and task.due_date:
            arena_id = task.arena.id
            tasks_by_date_by_arena.setdefault(arena_id, {})
            tasks_by_date_by_arena[arena_id].setdefault(
                task.due_date, []
            ).append(task)

    def compute_streaks(
        date_task_map: dict[date, list[Task]],
    ) -> tuple[int, int]:
        """Returns (current_streak, longest_streak)"""
        if not date_task_map:
            return 0, 0

        # Only keep days where 100% of tasks are completed
        perfect_days = sorted(
            [
                d
                for d, day_tasks in date_task_map.items()
                if len(day_tasks) > 0
                and all(t.is_completed for t in day_tasks)
            ]
        )

        if not perfect_days:
            return 0, 0

        # Compute longest streak
        longest = 1
        current_run = 1
        for i in range(1, len(perfect_days)):
            if (perfect_days[i] - perfect_days[i - 1]).days == 1:
                current_run += 1
                longest = max(longest, current_run)
            else:
                current_run = 1

        # Compute current streak — must include today or yesterday
        today = date.today()
        current = 0
        check = today
        while check in perfect_days or (
            check == today and today not in perfect_days
        ):
            if check not in perfect_days:
                if check == today:
                    # Allow streak to still be alive if yesterday was perfect
                    check -= timedelta(days=1)
                    continue
                break
            current += 1
            check -= timedelta(days=1)

        return current, longest

    # Overall streaks
    current_streak, longest_streak = compute_streaks(tasks_by_date)

    # Per-arena streaks
    arena_streaks = []
    arena_meta: dict[int, tuple[str, str]] = {}
    for task in tasks:
        if task.arena:
            arena_meta[task.arena.id] = (task.arena.name, task.arena.color)

    for arena_id, date_map in tasks_by_date_by_arena.items():
        arena_current, arena_longest = compute_streaks(date_map)
        name, color = arena_meta[arena_id]
        arena_streaks.append(
            ArenaStreakResponse(
                arena_id=arena_id,
                arena_name=name,
                arena_color=color,
                current_streak=arena_current,
                longest_streak=arena_longest,
            )
        )

    return StreakResponse(
        current_streak=current_streak,
        longest_streak=longest_streak,
        arenas=arena_streaks,
    )
