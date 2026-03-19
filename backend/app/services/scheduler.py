from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta, timezone
from app.database import SessionLocal
from app.models.user import User
from app.models.task import Task
from app.models.arena import Arena
from app.services.email import send_weekly_summary_email
from sqlalchemy.orm import contains_eager
import pytz

scheduler = AsyncIOScheduler()


async def send_weekly_summaries():
    db = SessionLocal()
    try:
        users = (
            db.query(User)
            .filter(User.weekly_email == True, User.is_verified == True)
            .all()
        )

        for user in users:
            try:
                tz = pytz.timezone(user.timezone or "UTC")
            except Exception:
                tz = pytz.UTC

            now_local = datetime.now(tz)

            # Only fire on Sunday (weekday=6) between 8:00 and 8:59 AM local time
            if now_local.weekday() != 6 or now_local.hour != 8:
                continue

            # Skip if we already sent an email today
            if user.last_weekly_email_sent:
                last_sent_local = user.last_weekly_email_sent.astimezone(tz)
                if last_sent_local.date() >= now_local.date():
                    continue

            # Last 7 days: Mon–Sat (the week that just ended)
            start_of_week = (now_local - timedelta(days=6)).date()
            end_of_week = (now_local - timedelta(days=1)).date()

            tasks = (
                db.query(Task)
                .join(Arena, Task.arena_id == Arena.id)
                .options(contains_eager(Task.arena))
                .filter(
                    Task.user_id == user.id,
                    Task.due_date >= start_of_week,
                    Task.due_date <= end_of_week,
                    Arena.is_archived == False,
                )
                .all()
            )

            total = len(tasks)
            completed = sum(1 for t in tasks if t.is_completed)
            completion_pct = round((completed / total * 100) if total > 0 else 0)
            total_hours = round(
                sum((t.duration or 0) for t in tasks if t.is_completed) / 60, 1
            )

            arena_map: dict = {}
            for task in tasks:
                if task.arena:
                    aid = task.arena.id
                    if aid not in arena_map:
                        arena_map[aid] = {
                            "name": task.arena.name,
                            "color": task.arena.color,
                            "total": 0,
                            "completed": 0,
                            "hours": 0.0,
                        }
                    arena_map[aid]["total"] += 1
                    if task.is_completed:
                        arena_map[aid]["completed"] += 1
                        arena_map[aid]["hours"] = round(
                            arena_map[aid]["hours"] + (task.duration or 0) / 60, 1
                        )

            arenas = sorted(arena_map.values(), key=lambda a: a["hours"], reverse=True)

            try:
                await send_weekly_summary_email(
                    email=user.email,
                    first_name=user.first_name,
                    start_date=start_of_week,
                    end_date=end_of_week,
                    total_tasks=total,
                    completed_tasks=completed,
                    completion_percentage=completion_pct,
                    total_hours=total_hours,
                    arenas=arenas,
                )
                user.last_weekly_email_sent = datetime.now(timezone.utc)
                db.commit()
                print(f"Weekly summary sent to {user.email}")
            except Exception as e:
                print(f"Failed to send weekly summary to {user.email}: {e}")

    finally:
        db.close()
