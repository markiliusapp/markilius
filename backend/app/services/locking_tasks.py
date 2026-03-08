from datetime import date
from datetime import date
from sqlalchemy.orm import Session
from app.models.task import Task


def lock_overdue_tasks(tasks: list[Task], db: Session) -> list[Task]:
    """
    Locks tasks that are past due date and not locked
    """
    today = date.today()
    for task in tasks:
        if task.due_date < today and not task.is_locked:
            task.is_locked = True

    db.commit()
    return tasks
