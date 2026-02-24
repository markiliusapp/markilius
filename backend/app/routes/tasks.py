from fastapi import APIRouter, status, Depends
from sqlalchemy.orm import Session
from app.schemas.task import TaskResponse, TaskCreate
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


@router.get(
    "/", response_model=list[TaskResponse], status_code=status.HTTP_200_OK
)
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
