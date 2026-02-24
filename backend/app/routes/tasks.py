from fastapi import APIRouter, status, Depends
from sqlalchemy.orm import Session
from app.schemas.task import TaskResponse, TaskCreate
from app.models.user import User
from app.utils.auth import get_current_user
from app.database import get_db
from app.models.task import Task

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
