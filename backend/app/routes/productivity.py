from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.productivity import (
    DailyProductivityResponse,
    MonthlyProductivityResponse,
    WeeklyProductivityResponse,
)
from datetime import date, timedelta
from app.models.user import User
from app.utils.auth import get_current_user, get_db
from sqlalchemy.orm import Session
from app.models.task import Task
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from calendar import monthrange

router = APIRouter(prefix="/productivity", tags=["Productivity"])


@router.get("/day", response_model=DailyProductivityResponse)
def get_daily_productivity(
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get productivity data for a specific date
    """
    try:
        # Count total number of tasks
        total_tasks = (
            db.query(func.count(Task.id))
            .filter(
                Task.user_id == current_user.id, Task.due_date == target_date
            )
            .scalar()
        )

        if total_tasks == 0:
            return DailyProductivityResponse(
                date=target_date,
                total_tasks=0,
                completed_tasks=0,
                completion_percentage=0.0,
                high_priority_tasks=0,
                low_priority_tasks=0,
                high_priority_completed=0,
                low_priority_completed=0,
                high_priority_completion_percentage=0.0,
                low_priority_completion_percentage=0.0,
                total_hours=0.0,
                high_priority_hours=0.0,
                low_priority_hours=0.0,
            )

        # Total number of completed tasks
        completed_tasks = (
            db.query(func.count(Task.id))
            .filter(
                Task.user_id == current_user.id,
                Task.due_date == target_date,
                Task.is_completed == True,
            )
            .scalar()
        )

        # Completion percentage of all tasks
        completion_percentage = round(completed_tasks / total_tasks * 100, 2)

        # Number of high priority tasks
        high_priority_tasks = (
            db.query(func.count(Task.id))
            .filter(
                Task.user_id == current_user.id,
                Task.due_date == target_date,
                Task.priority == True,
            )
            .scalar()
        )

        # Number of low priority tasks
        low_priority_tasks = total_tasks - high_priority_tasks

        # Count the number of high priority tasks that have been completed
        high_priority_completed = (
            db.query(func.count(Task.id))
            .filter(
                Task.user_id == current_user.id,
                Task.due_date == target_date,
                Task.priority == True,
                Task.is_completed == True,
            )
            .scalar()
        )

        # Count the number of low priority tasks that have been completed
        low_priority_completed = (
            db.query(func.count(Task.id))
            .filter(
                Task.user_id == current_user.id,
                Task.due_date == target_date,
                Task.priority == False,
                Task.is_completed == True,
            )
            .scalar()
        )

        # High priority completion percentage
        high_priority_completion_percentage = (
            round(high_priority_completed / high_priority_tasks * 100, 2)
            if high_priority_tasks > 0
            else 0.0
        )

        # Low priority completion percentage
        low_priority_completion_percentage = (
            round(low_priority_completed / low_priority_tasks * 100, 2)
            if low_priority_tasks > 0
            else 0.0
        )

        # Total time spent in hours
        total_duration = (
            db.query(func.sum(Task.duration))
            .filter(
                Task.user_id == current_user.id,
                Task.due_date == target_date,
                Task.is_completed == True,
            )
            .scalar()
            or 0
        )
        total_duration_hours = round(total_duration / 60, 2)

        # Time spent on high priority tasks
        high_priority_duration = (
            db.query(func.sum(Task.duration))
            .filter(
                Task.user_id == current_user.id,
                Task.due_date == target_date,
                Task.is_completed == True,
                Task.priority == True,
            )
            .scalar()
            or 0
        )
        high_priority_duration_hours = round(high_priority_duration / 60, 2)

        # Time spent on low priority tasks
        low_priority_duration_hours = round(
            total_duration_hours - high_priority_duration_hours, 2
        )

        return DailyProductivityResponse(
            date=target_date,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            completion_percentage=completion_percentage,
            high_priority_tasks=high_priority_tasks,
            low_priority_tasks=low_priority_tasks,
            high_priority_completed=high_priority_completed,
            low_priority_completed=low_priority_completed,
            high_priority_completion_percentage=high_priority_completion_percentage,
            low_priority_completion_percentage=low_priority_completion_percentage,
            total_hours=total_duration_hours,
            high_priority_hours=high_priority_duration_hours,
            low_priority_hours=low_priority_duration_hours,
        )

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching daily data",
        )


@router.get("/week", response_model=WeeklyProductivityResponse)
def get_weekly_productivity(
    start_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get productivity metrics for the entire week
    Returns daily breakdown and tasks per day + aggregate stats
    """
    end_date = start_date + timedelta(days=6)

    # Get all tasks for this week
    tasks = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.due_date <= end_date,
            Task.due_date >= start_date,
        )
        .all()
    )

    # Initialize 7 days hash table
    daily_data = {}
    for day in range(7):
        current_date = start_date + timedelta(days=day)
        daily_data[str(current_date)] = {
            "date": current_date,
            "total_tasks": 0,
            "completed_tasks": 0,
            "completion_percentage": 0,
            "total_duration": 0,
            "completed": [],
            "incomplete": [],
        }

    # Group tasks by date
    for task in tasks:
        date_key = str(task.due_date)
        if date_key in daily_data:
            daily_data[date_key]["total_tasks"] += 1

            if task.is_completed:
                daily_data[date_key]["completed_tasks"] += 1
                daily_data[date_key]["completed"].append(task)

                if task.duration:
                    daily_data[date_key]["total_duration"] = daily_data[
                        date_key
                    ]["total_duration"] + round(task.duration / 60, 2)

            else:
                daily_data[date_key]["incomplete"].append(task)

    # Calculate daily completion percentages
    for date_key in daily_data:
        total = daily_data[date_key]["total_tasks"]
        completed = daily_data[date_key]["completed_tasks"]
        if total > 0:
            daily_data[date_key]["completion_percentage"] = round(
                (completed / total) * 100, 1
            )

    # Calculate weekly totals
    week_total_tasks = sum(day["total_tasks"] for day in daily_data.values())
    week_completed_tasks = sum(
        day["completed_tasks"] for day in daily_data.values()
    )
    week_total_duration = sum(
        day["total_duration"] for day in daily_data.values()
    )

    week_completion_percentage = 0
    if week_total_tasks > 0:
        week_completion_percentage = round(
            (week_completed_tasks / week_total_tasks) * 100, 1
        )

    # Calculate averages (only count days with tasks)
    days_with_tasks = sum(
        1 for day in daily_data.values() if day["total_tasks"] > 0
    )
    avg_tasks_per_day = 0
    avg_duration_per_day = 0
    if days_with_tasks > 0:
        avg_tasks_per_day = round(week_total_tasks / days_with_tasks, 1)
        avg_duration_per_day = round(week_total_duration / days_with_tasks, 1)

    # Find most productive day
    days_with_data = [
        day for day in daily_data.values() if day["total_tasks"] > 0
    ]
    most_productive_day = None
    if days_with_data:
        best_day = days_with_data[0]
        for day in days_with_data[1:]:
            if (
                day["completion_percentage"]
                > best_day["completion_percentage"]
            ):
                best_day = day
            elif (
                day["completion_percentage"]
                == best_day["completion_percentage"]
            ):
                if day["total_duration"] > best_day["total_duration"]:
                    best_day = day

        most_productive_day = {
            "date": best_day["date"],
            "total_tasks": best_day["total_tasks"],
            "completed_tasks": best_day["completed_tasks"],
            "completion_percentage": best_day["completion_percentage"],
            "total_duration": best_day["total_duration"],
        }

    return {
        "start_date": start_date,
        "end_date": end_date,
        "summary": {
            "total_tasks": week_total_tasks,
            "completed_tasks": week_completed_tasks,
            "completion_percentage": week_completion_percentage,
            "total_duration_minutes": week_total_duration,
            "average_tasks_per_day": avg_tasks_per_day,
            "average_duration_per_day": avg_duration_per_day,
            "days_with_tasks": days_with_tasks,
        },
        "most_productive_day": most_productive_day,
        "daily_breakdown": list(daily_data.values()),
    }


@router.get("/month", response_model=MonthlyProductivityResponse)
def get_monthly_productivity(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get productivity metrics for the entire month
    Returns daily breakdown for heatmap + aggregate stats
    """

    # Get the first and last day of the month
    first_day = date(year, month, 1)
    last_day_number = monthrange(year, month)[1]
    last_day = date(year, month, last_day_number)

    # Get all the tasks for the current month
    try:
        tasks = (
            db.query(Task)
            .filter(
                Task.user_id == current_user.id,
                Task.due_date <= last_day,
                Task.due_date >= first_day,
            )
            .all()
        )

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching monthly data",
        )

    # Group tasks by date
    daily_data = {}
    for i in range(1, last_day_number + 1):
        current_date = date(year, month, i)
        daily_data[str(current_date)] = {
            "date": current_date,
            "total_tasks": 0,
            "completed_tasks": 0,
            "completion_percentage": 0.0,
            "total_duration": 0,
        }

    # Count tasks for each day
    for task in tasks:
        date_key = str(task.due_date)
        if date_key in daily_data:
            daily_data[date_key]["total_tasks"] += 1
            if task.is_completed:
                daily_data[date_key]["completed_tasks"] += 1
            if (
                task.is_completed and task.duration
            ):  # only count the duration for completed tasks
                daily_data[date_key]["total_duration"] = daily_data[date_key][
                    "total_duration"
                ] + round(task.duration / 60, 2)

    # Calcuate percentages for each day
    for date_key in daily_data:
        total = daily_data[date_key]["total_tasks"]
        completed = daily_data[date_key]["completed_tasks"]
        if total > 0:
            daily_data[date_key]["completion_percentage"] = round(
                (completed / total) * 100, 1
            )

    # Calculate Monthly totals
    month_total_tasks = sum(
        [day["total_tasks"] for day in daily_data.values()]
    )
    month_completed_tasks = sum(
        [day["completed_tasks"] for day in daily_data.values()]
    )
    month_total_duration = sum(
        [day["total_duration"] for day in daily_data.values()]
    )

    # Calcuate month completion percentage
    month_completion_percentage = 0
    if month_total_tasks > 0:
        month_completion_percentage = round(
            month_completed_tasks / month_total_tasks * 100, 2
        )

    # Calcuate averages (only count days with tasks)
    days_with_task = sum(
        [1 for day in daily_data.values() if day["total_tasks"] > 0]
    )
    avg_daily_task = 0
    avg_daily_duration = 0
    if month_total_tasks > 0:
        avg_daily_task = round(month_total_tasks / days_with_task, 1)
        avg_daily_duration = round(month_total_duration / days_with_task, 1)

    # Find most productive day
    # Sort by: 1) completion_percentage DESC, 2) total_duration DESC
    most_productive_day = None
    all_days_with_tasks = [
        day for day in daily_data.values() if day["total_tasks"] > 0
    ]
    if all_days_with_tasks:
        best_day = all_days_with_tasks[0]
        for day in all_days_with_tasks[1:]:
            if (
                day["completion_percentage"]
                > best_day["completion_percentage"]
            ):
                best_day = day
            # User duration as tie breaker
            elif (
                day["completion_percentage"]
                == best_day["completion_percentage"]
            ):
                if day["total_duration"] > best_day["total_duration"]:
                    best_day = day

        most_productive_day = {
            "date": best_day["date"],
            "total_tasks": best_day["total_tasks"],
            "completed_tasks": best_day["completed_tasks"],
            "completion_percentage": best_day["completion_percentage"],
            "total_duration": best_day["total_duration"],
        }

    return {
        "year": year,
        "month": month,
        "summary": {
            "total_tasks": month_total_tasks,
            "completed_tasks": month_completed_tasks,
            "completion_percentage": month_completion_percentage,
            "total_duration_hours": month_total_duration,
            "average_tasks_per_day": avg_daily_task,
            "average_duration_per_day": avg_daily_duration,
            "days_with_tasks": days_with_task,
        },
        "most_productive_day": most_productive_day,
        "daily_breakdown": list(daily_data.values()),
    }
