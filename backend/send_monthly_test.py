"""One-off script: send the February 2026 monthly summary email to user_id 16."""
import asyncio
from calendar import monthrange
from datetime import date, timedelta

from app.database import SessionLocal
from app.models.arena import Arena
from app.models.task import Task
from app.models.user import User
from app.services.email import send_monthly_summary_email
from sqlalchemy.orm import contains_eager

YEAR = 2026
MONTH = 3
USER_ID = 16


def build_weekly_chunks(year: int, month: int):
    last_day = monthrange(year, month)[1]
    chunks = []
    start = 1
    while start <= last_day:
        end = min(start + 6, last_day)
        chunks.append((date(year, month, start), date(year, month, end)))
        start += 7
    return chunks


async def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == USER_ID).first()
        if not user:
            print(f"User {USER_ID} not found.")
            return

        first_day = date(YEAR, MONTH, 1)
        last_day  = date(YEAR, MONTH, monthrange(YEAR, MONTH)[1])

        tasks = (
            db.query(Task)
            .join(Arena, Task.arena_id == Arena.id)
            .options(contains_eager(Task.arena))
            .filter(
                Task.user_id == USER_ID,
                Task.due_date >= first_day,
                Task.due_date <= last_day,
                Arena.is_archived == False,
            )
            .all()
        )

        all_user_arenas = (
            db.query(Arena)
            .filter(Arena.user_id == USER_ID, Arena.is_archived == False)
            .all()
        )
        all_arenas = [{"name": a.name, "color": a.color} for a in all_user_arenas]

        total_tasks       = len(tasks)
        completed_tasks   = sum(1 for t in tasks if t.is_completed)
        completion_pct    = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
        total_hours       = round(sum((t.duration or 0) for t in tasks if t.is_completed) / 60, 1)

        # Daily breakdown
        last_day_num = monthrange(YEAR, MONTH)[1]
        tasks_by_date: dict = {date(YEAR, MONTH, i + 1): [] for i in range(last_day_num)}
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

        # Weekly chunks for best/worst
        week_stats = []
        for (wstart, wend) in build_weekly_chunks(YEAR, MONTH):
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

        best_week  = max(week_stats, key=lambda w: (w["pct"], w["hours"])) if week_stats else None
        worst_week = min(week_stats, key=lambda w: (w["pct"], w["hours"])) if week_stats else None
        if best_week == worst_week:
            worst_week = None

        print(f"Sending to {user.email}…")
        await send_monthly_summary_email(
            email=user.email,
            first_name=user.first_name,
            year=YEAR,
            month=MONTH,
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
        print("Done.")
    finally:
        db.close()


asyncio.run(main())
