"""
Seed streak test data for user 39.
Creates tasks across Jan–Mar 2026 with varied streak patterns:

Overall streaks:
  Jan  3– 8  →  6-day streak
  Jan 15–21  →  7-day streak
  Jan 25–31  →  7-day streak (continues into February)
  Feb  1– 7  →  continues from Jan (14-day cross-month streak total)
  Feb 12–14  →  3-day streak
  Feb 18–25  →  8-day streak
  Mar  3– 6  →  4-day streak
  Mar 10–22  →  13-day streak (spans 2 full week rows)
  Mar 24–27  →  4-day streak (ends today)

Per-arena patterns (to test arena filtering):
  Fitness   (233): participates in most streaks
  Learning  (234): skips some days — shorter individual streaks
  Work      (235): weekday-heavy — misses weekends within streaks
  Creativity(236): sparse — only participates in a few streaks
  Mindfulness(237): participates in most streaks
"""

import os
import sys
from datetime import date, timedelta
from dotenv import load_dotenv

load_dotenv()

from app.models.user import User
from app.models.arena import Arena
from app.models.task import Task
from app.database import SessionLocal

USER_ID = 39

# Arena IDs for user 39
FITNESS     = 233
LEARNING    = 234
WORK        = 235
CREATIVITY  = 236
MINDFULNESS = 237

def daterange(start: date, end: date):
    """Inclusive range of dates."""
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)

def make_date(y, m, d):
    return date(y, m, d)

# ─────────────────────────────────────────────
# Define which arenas participate per date
# ─────────────────────────────────────────────

def get_arenas_for_day(d: date, in_streak: bool) -> list[dict]:
    """
    Return a list of {arena_id, completed} dicts for tasks to create on date d.

    Streak days: ALL tasks completed = 100% completion for the day.
      Per-arena variation is expressed by simply not creating tasks for some arenas
      on certain days (absence != incomplete task).

    Gap days: one incomplete task so the heatmap cell has a visible color but < 100%.
    """
    if not in_streak:
        # Gap day: one incomplete task so the cell has color (partial) but breaks the streak
        return [{"arena_id": FITNESS, "completed": False}]

    weekday = d.weekday()  # 0=Mon, 6=Sun
    is_weekend = weekday >= 5

    arenas = []

    # Fitness + Mindfulness: every streak day, always completed
    arenas.append({"arena_id": FITNESS, "completed": True})
    arenas.append({"arena_id": MINDFULNESS, "completed": True})

    # Learning: only weekdays (no task created on weekends → no incomplete drag)
    if not is_weekend:
        arenas.append({"arena_id": LEARNING, "completed": True})

    # Work: only weekdays
    if not is_weekend:
        arenas.append({"arena_id": WORK, "completed": True})

    # Creativity: only in March streaks
    if d.month == 3:
        arenas.append({"arena_id": CREATIVITY, "completed": True})

    return arenas


def build_streak_dates() -> set[date]:
    """Return the full set of dates that should be 'active' (in a streak)."""
    active = set()

    # January streaks
    for d in daterange(make_date(2026, 1, 3), make_date(2026, 1, 8)):
        active.add(d)
    for d in daterange(make_date(2026, 1, 15), make_date(2026, 1, 21)):
        active.add(d)
    # Cross-month streak: Jan 25 → Feb 7
    for d in daterange(make_date(2026, 1, 25), make_date(2026, 2, 7)):
        active.add(d)

    # February streaks
    for d in daterange(make_date(2026, 2, 12), make_date(2026, 2, 14)):
        active.add(d)
    for d in daterange(make_date(2026, 2, 18), make_date(2026, 2, 25)):
        active.add(d)

    # March streaks
    for d in daterange(make_date(2026, 3, 3), make_date(2026, 3, 6)):
        active.add(d)
    for d in daterange(make_date(2026, 3, 10), make_date(2026, 3, 22)):
        active.add(d)
    for d in daterange(make_date(2026, 3, 24), make_date(2026, 3, 27)):
        active.add(d)

    return active


def seed():
    db = SessionLocal()
    today = date(2026, 3, 27)

    # Remove any existing seeded tasks for user 39 in this date range
    # to allow re-running without duplicates
    start_range = make_date(2026, 1, 1)
    end_range = make_date(2026, 3, 27)

    deleted = db.query(Task).filter(
        Task.user_id == USER_ID,
        Task.due_date >= start_range,
        Task.due_date <= end_range,
    ).delete(synchronize_session=False)
    db.commit()
    print(f"Deleted {deleted} existing tasks in range.")

    active_dates = build_streak_dates()

    # All days in range that we want to populate
    all_days = list(daterange(start_range, end_range))

    created = 0
    for d in all_days:
        in_streak = d in active_dates
        tasks_for_day = get_arenas_for_day(d, in_streak)

        for t in tasks_for_day:
            is_past = d < today
            task = Task(
                user_id=USER_ID,
                title=_task_title(t["arena_id"], in_streak),
                frequency="once",
                due_date=d,
                arena_id=t["arena_id"],
                is_completed=t["completed"],
                is_locked=is_past,  # past tasks are locked
                duration=30,        # 30 min per task
            )
            db.add(task)
            created += 1

    db.commit()
    db.close()

    total_streak_days = len(active_dates)
    print(f"Created {created} tasks across {len(all_days)} days ({total_streak_days} active streak days).")
    print("Done.")


def _task_title(arena_id: int, completed: bool) -> str:
    names = {
        FITNESS: "Morning workout",
        LEARNING: "Study session",
        WORK: "Deep work block",
        CREATIVITY: "Creative practice",
        MINDFULNESS: "Meditation",
    }
    return names.get(arena_id, "Task")


if __name__ == "__main__":
    seed()
