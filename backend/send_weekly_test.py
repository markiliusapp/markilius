"""One-off script: send a weekly summary email to user_id 16 for the current week."""
import asyncio
from datetime import date, timedelta

from app.database import SessionLocal
from app.models.arena import Arena
from app.models.task import Task
from app.models.user import User
from app.services.email import send_weekly_summary_email
from sqlalchemy.orm import contains_eager

USER_ID = 16

END_DATE   = date.today() - timedelta(days=1)
START_DATE = END_DATE - timedelta(days=6)


async def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == USER_ID).first()
        if not user:
            print(f"User {USER_ID} not found.")
            return

        tasks = (
            db.query(Task)
            .join(Arena, Task.arena_id == Arena.id)
            .options(contains_eager(Task.arena))
            .filter(
                Task.user_id == USER_ID,
                Task.due_date >= START_DATE,
                Task.due_date <= END_DATE,
                Arena.is_archived == False,
            )
            .all()
        )

        # All non-archived arenas for this user (to surface missed arenas)
        all_user_arenas = (
            db.query(Arena)
            .filter(Arena.user_id == USER_ID, Arena.is_archived == False)
            .all()
        )
        all_arenas = [{"name": a.name, "color": a.color} for a in all_user_arenas]

        total = len(tasks)
        completed = sum(1 for t in tasks if t.is_completed)
        completion_pct = round((completed / total * 100) if total > 0 else 0)
        total_hours = round(sum((t.duration or 0) for t in tasks if t.is_completed) / 60, 1)

        # Daily breakdown for chart + stat computation
        tasks_by_date: dict = {}
        current = START_DATE
        while current <= END_DATE:
            tasks_by_date[current] = []
            current += timedelta(days=1)
        for t in tasks:
            if t.due_date in tasks_by_date:
                tasks_by_date[t.due_date].append(t)

        daily_breakdown = []
        for d, day_tasks in sorted(tasks_by_date.items()):
            dt = len(day_tasks)
            dc = sum(1 for t in day_tasks if t.is_completed)
            day_arena_map: dict = {}
            for t in day_tasks:
                if t.arena:
                    aid = t.arena.id
                    if aid not in day_arena_map:
                        day_arena_map[aid] = {"name": t.arena.name, "color": t.arena.color, "hours": 0.0}
                    if t.is_completed:
                        day_arena_map[aid]["hours"] = round(day_arena_map[aid]["hours"] + (t.duration or 0) / 60, 1)
            daily_breakdown.append({
                "date": str(d),
                "total_tasks": dt,
                "completed_tasks": dc,
                "completion_percentage": round((dc / dt * 100) if dt > 0 else 0, 1),
                "arenas": list(day_arena_map.values()),
            })

        days_with_tasks = sum(1 for d in daily_breakdown if d["total_tasks"] > 0)
        avg_tasks_per_day = round(total / days_with_tasks if days_with_tasks > 0 else 0, 1)

        # Best and worst day
        candidates = [d for d in daily_breakdown if d["total_tasks"] > 0]
        most_productive_day = None
        least_productive_day = None
        if candidates:
            best = max(candidates, key=lambda d: (d["completion_percentage"], d["completed_tasks"]))
            worst = min(candidates, key=lambda d: (d["completion_percentage"], d["completed_tasks"]))
            d_best  = date.fromisoformat(best["date"])
            d_worst = date.fromisoformat(worst["date"])
            most_productive_day  = {"day_name": d_best.strftime("%a"),  "completion_percentage": best["completion_percentage"]}
            # Only show worst day if it's different from best
            if worst["date"] != best["date"]:
                least_productive_day = {"day_name": d_worst.strftime("%a"), "completion_percentage": worst["completion_percentage"]}

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

        print(f"Sending to {user.email}…")
        await send_weekly_summary_email(
            email=user.email,
            first_name=user.first_name,
            start_date=START_DATE,
            end_date=END_DATE,
            total_tasks=total,
            completed_tasks=completed,
            completion_percentage=completion_pct,
            total_hours=total_hours,
            arenas=arenas,
            avg_tasks_per_day=avg_tasks_per_day,
            days_with_tasks=days_with_tasks,
            most_productive_day=most_productive_day,
            least_productive_day=least_productive_day,
            daily_breakdown=daily_breakdown,
            all_arenas=all_arenas,
        )
        print("Done.")
    finally:
        db.close()


asyncio.run(main())
