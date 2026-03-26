from datetime import datetime
from sqlalchemy.orm import Session
from app.models.task import Task
import pytz


def lock_overdue_tasks(tasks: list[Task], db: Session, user_timezone: str = "UTC") -> list[Task]:
    """
    Locks tasks that are past due date and not locked.
    Uses the user's local timezone so that tasks aren't locked prematurely
    for users whose local date differs from the server's UTC date.
    """
    try:
        tz = pytz.timezone(user_timezone)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
    today = datetime.now(tz).date()

    for task in tasks:
        if task.due_date < today and not task.is_locked:
            task.is_locked = True

    db.commit()
    return tasks
