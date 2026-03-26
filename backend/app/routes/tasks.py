from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.task import TaskResponse, TaskCreate, TaskUpdate
from app.models.user import User
from app.utils.auth import require_subscription, require_write_access
from app.database import get_db
from app.models.task import Task
from app.models.arena import Arena
from typing import Optional
from datetime import date, datetime
import pytz
from app.services.locking_tasks import lock_overdue_tasks
from sqlalchemy.orm import joinedload, contains_eager
from app.services.frequency_management import generate_due_dates
import uuid


router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED
)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(require_write_access),
    db: Session = Depends(get_db),
) -> TaskResponse:
    """
    Creates a new task for the current user
    """

    arena = (
        db.query(Arena)
        .filter(
            Arena.id == task_data.arena_id, Arena.user_id == current_user.id
        )
        .first()
    )
    if not arena:
        raise HTTPException(status_code=404, detail="Arena not found")
    if arena.is_archived:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot create a task in an archived arena",
        )

    # Generate shared group_id for recurring tasks
    group_id = (
        str(uuid.uuid4()) if task_data.frequency.value != "once" else None
    )
    due_dates = generate_due_dates(task_data.due_date, task_data.frequency)

    new_tasks = [
        Task(
            user_id=current_user.id,
            title=task_data.title,
            description=task_data.description,
            frequency=task_data.frequency.value,
            duration=task_data.duration,
            due_date=due_date,
            arena_id=task_data.arena_id,
            group_id=group_id,
        )
        for due_date in due_dates
    ]

    db.add_all(new_tasks)
    db.commit()

    # Refresh all to get IDs and relationships
    for task in new_tasks:
        db.refresh(task)

    return new_tasks[0]


@router.get("/", response_model=list[TaskResponse])
def get_task(
    status: Optional[bool] = None,
    due_date: Optional[date] = None,
    current_user: User = Depends(require_subscription),
    db: Session = Depends(get_db),
):
    """
    Returns all the tasks for a given status and a due date
    """
    query = (
        db.query(Task)
        .join(Arena, Task.arena_id == Arena.id)
        .options(contains_eager(Task.arena))
        .filter(Task.user_id == current_user.id, Arena.is_archived == False)
    )
    if status is not None:
        query = query.filter(Task.is_completed == status)

    # status = true means completed tasks
    # status = false means active/incompelete tasks

    if due_date:
        query = query.filter(Task.due_date == due_date)

    # Order by due_date (most recent first), then created_at
    tasks = query.order_by(Task.due_date.desc(), Task.created_at.desc()).all()
    tasks = lock_overdue_tasks(tasks, db, current_user.timezone)

    return tasks


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    """
    Update an existing task (only if it belongs to current user and not locked)

    """

    task = (
        db.query(Task)
        .options(joinedload(Task.arena))
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Verify owernship
    if current_user.id != task.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task",
        )

    if task.arena and task.arena.is_archived:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot update a task that belongs to an archived arena",
        )

    if task_data.arena_id is not None and task_data.arena_id != task.arena_id:
        new_arena = (
            db.query(Arena)
            .filter(
                Arena.id == task_data.arena_id,
                Arena.user_id == current_user.id,
            )
            .first()
        )
        if not new_arena:
            raise HTTPException(status_code=404, detail="Arena not found")
        if new_arena.is_archived:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot move a task to an archived arena",
            )

    # Check if the task is locked (can't update locked tasks)

    if task.is_locked:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Cannot update locked task - Past Deadline",
        )

    # Update only provided fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.frequency is not None:
        task.frequency = task_data.frequency.value
    if task_data.duration is not None:
        task.duration = task_data.duration
    if task_data.due_date is not None:
        task.due_date = task_data.due_date
    if task_data.arena_id is not None:
        task.arena_id = task_data.arena_id

    db.commit()
    db.refresh(task)

    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    """
    Deletes a task given a task_id
    """
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Check if task is locked
    if task.is_locked:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Task is locked - Can't delete a task past its deadline",
        )

    # Verify owernship
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task",
        )

    db.delete(task)
    db.commit()

    return None


@router.patch("/{task_id}", response_model=TaskResponse)
def toggle_task_completion(
    task_id: int,
    current_user: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    """
    Toggles a task's completion status
    Only allowed before task's due date and if the task is not locked
    """
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Verify ownership
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this task",
        )

    # Check if the task is locked/past its deadline
    if task.is_locked:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Cannot modify locked task",
        )

    # Toggle completion status
    task.is_completed = not task.is_completed

    db.commit()
    db.refresh(task)

    return task


@router.delete("/{task_id}/series", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_series(
    task_id: int,
    current_user: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    # Find the task to get its group_id
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.group_id:
        raise HTTPException(
            status_code=400, detail="Task is not part of a series"
        )

    # Delete all incomplete future tasks in the series (use user's local date)
    try:
        tz = pytz.timezone(current_user.timezone or "UTC")
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
    today_local = datetime.now(tz).date()

    db.query(Task).filter(
        Task.group_id == task.group_id,
        Task.user_id == current_user.id,
        Task.is_completed == False,
        Task.due_date >= today_local,
    ).delete(synchronize_session=False)

    db.commit()
