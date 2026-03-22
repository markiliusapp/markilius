from apscheduler.schedulers.asyncio import AsyncIOScheduler
from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from app.database import SessionLocal
from app.models.user import User
from app.models.task import Task
from app.models.arena import Arena
from app.services.email import send_weekly_summary_email, send_monthly_summary_email
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


def _build_weekly_chunks(year: int, month: int):
    last_day = monthrange(year, month)[1]
    chunks = []
    start = 1
    while start <= last_day:
        end = min(start + 6, last_day)
        chunks.append((date(year, month, start), date(year, month, end)))
        start += 7
    return chunks


async def send_monthly_summaries():
    db = SessionLocal()
    try:
        users = (
            db.query(User)
            .filter(User.monthly_email == True, User.is_verified == True)
            .all()
        )

        for user in users:
            try:
                tz = pytz.timezone(user.timezone or "UTC")
            except Exception:
                tz = pytz.UTC

            now_local = datetime.now(tz)

            # Only fire on the 1st of the month between 8:00 and 8:59 AM local time
            if now_local.day != 1 or now_local.hour != 8:
                continue

            # Skip if we already sent an email this month
            if user.last_monthly_email_sent:
                last_sent_local = user.last_monthly_email_sent.astimezone(tz)
                if (
                    last_sent_local.year == now_local.year
                    and last_sent_local.month == now_local.month
                ):
                    continue

            # Previous month
            if now_local.month == 1:
                year, month = now_local.year - 1, 12
            else:
                year, month = now_local.year, now_local.month - 1

            first_day = date(year, month, 1)
            last_day = date(year, month, monthrange(year, month)[1])

            tasks = (
                db.query(Task)
                .join(Arena, Task.arena_id == Arena.id)
                .options(contains_eager(Task.arena))
                .filter(
                    Task.user_id == user.id,
                    Task.due_date >= first_day,
                    Task.due_date <= last_day,
                    Arena.is_archived == False,
                )
                .all()
            )

            total_tasks = len(tasks)

            # Skip if zero activity — silence is more honest than an empty report
            if total_tasks == 0:
                continue

            completed_tasks = sum(1 for t in tasks if t.is_completed)
            completion_pct = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
            total_hours = round(sum((t.duration or 0) for t in tasks if t.is_completed) / 60, 1)

            # Daily breakdown
            last_day_num = monthrange(year, month)[1]
            tasks_by_date: dict = {date(year, month, i + 1): [] for i in range(last_day_num)}
            for t in tasks:
                if t.due_date in tasks_by_date:
                    tasks_by_date[t.due_date].append(t)

            daily_breakdown = [
                {
                    "date": str(d),
                    "total_tasks": len(ts),
                    "completion_percentage": round(
                        sum(1 for t in ts if t.is_completed) / len(ts) * 100 if ts else 0, 1
                    ),
                }
                for d, ts in sorted(tasks_by_date.items())
            ]

            days_with_tasks = sum(1 for dt in tasks_by_date.values() if len(dt) > 0)
            avg_tasks_per_day = round(total_tasks / days_with_tasks if days_with_tasks > 0 else 0, 1)
            avg_duration_per_day = round(total_hours / days_with_tasks if days_with_tasks > 0 else 0, 1)
            perfect_days = sum(
                1 for dt in tasks_by_date.values()
                if len(dt) > 0 and all(t.is_completed for t in dt)
            )

            # Most productive day
            candidates = [
                {
                    "date": d,
                    "total": len(ts),
                    "completed": sum(1 for t in ts if t.is_completed),
                    "hours": round(sum((t.duration or 0) for t in ts if t.is_completed) / 60, 1),
                }
                for d, ts in tasks_by_date.items() if len(ts) > 0
            ]
            most_productive_day = None
            if candidates:
                best = max(
                    candidates,
                    key=lambda c: (round((c["completed"] / c["total"] * 100) if c["total"] > 0 else 0), c["hours"]),
                )
                best_pct = round((best["completed"] / best["total"] * 100) if best["total"] > 0 else 0)
                most_productive_day = {
                    "date_label": best["date"].strftime("%b %d"),
                    "completion_percentage": best_pct,
                }

            # Arena breakdown
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

            arenas = sorted(arena_map.values(), key=lambda a: a["completed"], reverse=True)
            most_completed_arena = arenas[0]["name"] if arenas else None
            neglected_candidates = [a for a in arenas if a["total"] > 0]
            most_neglected_arena = (
                min(neglected_candidates, key=lambda a: (a["completed"] / a["total"], a["hours"]))["name"]
                if neglected_candidates else None
            )

            # All active arenas for heatmap legend
            all_user_arenas = (
                db.query(Arena)
                .filter(Arena.user_id == user.id, Arena.is_archived == False)
                .all()
            )
            all_arenas = [{"name": a.name, "color": a.color} for a in all_user_arenas]

            # Best/worst week
            week_stats = []
            for (wstart, wend) in _build_weekly_chunks(year, month):
                week_tasks = [t for d, ts in tasks_by_date.items() if wstart <= d <= wend for t in ts]
                if not week_tasks:
                    continue
                wt = len(week_tasks)
                wc = sum(1 for t in week_tasks if t.is_completed)
                wh = round(sum((t.duration or 0) for t in week_tasks if t.is_completed) / 60, 1)
                week_stats.append({
                    "start": wstart,
                    "end": wend,
                    "pct": round((wc / wt * 100) if wt > 0 else 0, 1),
                    "hours": wh,
                })

            best_week = max(week_stats, key=lambda w: (w["pct"], w["hours"])) if week_stats else None
            worst_week = min(week_stats, key=lambda w: (w["pct"], w["hours"])) if week_stats else None
            if best_week == worst_week:
                worst_week = None

            try:
                await send_monthly_summary_email(
                    email=user.email,
                    first_name=user.first_name,
                    year=year,
                    month=month,
                    total_tasks=total_tasks,
                    completed_tasks=completed_tasks,
                    completion_percentage=completion_pct,
                    total_hours=total_hours,
                    best_week=best_week,
                    worst_week=worst_week,
                    most_completed_arena=most_completed_arena,
                    most_neglected_arena=most_neglected_arena,
                    arenas=arenas,
                    avg_tasks_per_day=avg_tasks_per_day,
                    avg_duration_per_day=avg_duration_per_day,
                    days_with_tasks=days_with_tasks,
                    perfect_days=perfect_days,
                    most_productive_day=most_productive_day,
                    daily_breakdown=daily_breakdown,
                    all_arenas=all_arenas,
                )
                user.last_monthly_email_sent = datetime.now(timezone.utc)
                db.commit()
                print(f"Monthly summary sent to {user.email}")
            except Exception as e:
                print(f"Failed to send monthly summary to {user.email}: {e}")

    finally:
        db.close()
