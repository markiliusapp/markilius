from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.task import TaskResponse, TaskCreate, TaskUpdate
from app.models.user import User
from app.utils.auth import get_current_user
from app.database import get_db
from app.models.task import Task
from typing import Optional
from datetime import date

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED
)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskResponse:
    """
    Creates a new task for the current user
    """
    new_task = Task(
        user_id=current_user.id,
        title=task_data.title,
        description=task_data.description,
        frequency=task_data.frequency.value,
        priority=task_data.priority,
        duration=task_data.duration,
        due_date=task_data.due_date,
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get("/", response_model=list[TaskResponse])
def get_task(
    status: Optional[bool] = None,
    due_date: Optional[date] = None,
    priority: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if status is not None:
        query = query.filter(Task.is_completed == status)

    # status = true means completed tasks
    # status = false means active/incompelete tasks

    if due_date:
        query = query.filter(Task.due_date == due_date)

    if priority is not None:
        query = query.filter(Task.priority == priority)

    # priority = true means high priority task
    # priority = false means low priority task

    # Order by due_date (most recent first), then created_at
    tasks = query.order_by(Task.due_date.desc(), Task.created_at.desc()).all()
    return tasks


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an existing task (only if it belongs to current user and not locked)

    """

    task = db.query(Task).filter(Task.id == task_id).first()

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
    if task_data.priority is not None:
        task.priority = task_data.priority
    if task_data.duration is not None:
        task.duration = task_data.duration
    if task_data.due_date is not None:
        task.due_date = task_data.due_date

    db.commit()
    db.refresh(task)

    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a task given a task_id
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    print("printing queried task: ", task)

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
