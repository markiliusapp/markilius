"""
Tests for /productivity endpoints.

All four endpoints aggregate task data, so tests seed the DB directly
with known tasks and assert on the calculated response fields.
"""

from datetime import date, timedelta

import pytest

from app.models.arena import Arena
from app.models.task import Task

TODAY = date.today()
YESTERDAY = TODAY - timedelta(days=1)

# A fixed past Monday used as a stable weekly anchor
PAST_MONDAY = date(2026, 3, 9)  # Monday


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def seed_task(db, user_id, arena_id, due_date, is_completed=False, duration=None):
    task = Task(
        user_id=user_id,
        arena_id=arena_id,
        title="Task",
        frequency="once",
        due_date=due_date,
        is_completed=is_completed,
        is_locked=False,
        duration=duration,
    )
    db.add(task)
    db.commit()
    return task


# ---------------------------------------------------------------------------
# GET /productivity/day
# ---------------------------------------------------------------------------


def test_daily_empty(client, test_user, test_arena, auth_headers):
    response = client.get(
        "/productivity/day",
        params={"target_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_tasks"] == 0
    assert data["completed_tasks"] == 0
    assert data["completion_percentage"] == 0
    assert data["total_hours"] == 0
    assert data["arenas"] == []


def test_daily_counts(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=True, duration=60)
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=False)

    response = client.get(
        "/productivity/day",
        params={"target_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    data = response.json()
    assert data["total_tasks"] == 2
    assert data["completed_tasks"] == 1
    assert data["completion_percentage"] == 50.0
    assert data["total_hours"] == 1.0  # 60 min → 1 hour


def test_daily_excludes_other_dates(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY)
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY + timedelta(days=1))

    response = client.get(
        "/productivity/day",
        params={"target_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    assert response.json()["total_tasks"] == 1


def test_daily_arena_breakdown(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=True)

    response = client.get(
        "/productivity/day",
        params={"target_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    arenas = response.json()["arenas"]
    assert len(arenas) == 1
    assert arenas[0]["arena_id"] == test_arena.id
    assert arenas[0]["completed_tasks"] == 1


def test_daily_excludes_archived_arena(client, db, test_user, auth_headers):
    archived = Arena(
        user_id=test_user.id, name="Gone", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()
    seed_task(db, test_user.id, archived.id, PAST_MONDAY, is_completed=True)

    response = client.get(
        "/productivity/day",
        params={"target_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    assert response.json()["total_tasks"] == 0


def test_daily_requires_auth(client):
    response = client.get(
        "/productivity/day", params={"target_date": str(PAST_MONDAY)}
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /productivity/week
# ---------------------------------------------------------------------------


def test_weekly_empty(client, test_user, test_arena, auth_headers):
    response = client.get(
        "/productivity/week",
        params={"start_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total_tasks"] == 0
    assert data["summary"]["completed_tasks"] == 0
    assert data["summary"]["days_with_tasks"] == 0
    assert data["most_productive_day"] is None
    assert len(data["daily_breakdown"]) == 7


def test_weekly_end_date_is_plus_six(client, test_user, test_arena, auth_headers):
    response = client.get(
        "/productivity/week",
        params={"start_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    data = response.json()
    assert data["start_date"] == str(PAST_MONDAY)
    assert data["end_date"] == str(PAST_MONDAY + timedelta(days=6))


def test_weekly_counts(client, db, test_user, test_arena, auth_headers):
    # Monday: 1 completed, 1 incomplete
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=True, duration=120)
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=False)
    # Wednesday: 1 completed
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY + timedelta(days=2), is_completed=True)

    response = client.get(
        "/productivity/week",
        params={"start_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    summary = response.json()["summary"]
    assert summary["total_tasks"] == 3
    assert summary["completed_tasks"] == 2
    assert summary["days_with_tasks"] == 2
    assert summary["total_duration_hours"] == 2.0  # 120 min → 2 hours


def test_weekly_most_productive_day(client, db, test_user, test_arena, auth_headers):
    # Monday: 1/2 = 50%
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=True)
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=False)
    # Wednesday: 1/1 = 100%
    wednesday = PAST_MONDAY + timedelta(days=2)
    seed_task(db, test_user.id, test_arena.id, wednesday, is_completed=True)

    response = client.get(
        "/productivity/week",
        params={"start_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    mpd = response.json()["most_productive_day"]
    assert mpd is not None
    assert mpd["date"] == str(wednesday)
    assert mpd["completion_percentage"] == 100.0


def test_weekly_excludes_tasks_outside_range(
    client, db, test_user, test_arena, auth_headers
):
    before = PAST_MONDAY - timedelta(days=1)
    after = PAST_MONDAY + timedelta(days=7)
    seed_task(db, test_user.id, test_arena.id, before)
    seed_task(db, test_user.id, test_arena.id, after)

    response = client.get(
        "/productivity/week",
        params={"start_date": str(PAST_MONDAY)},
        headers=auth_headers,
    )
    assert response.json()["summary"]["total_tasks"] == 0


def test_weekly_requires_auth(client):
    response = client.get(
        "/productivity/week", params={"start_date": str(PAST_MONDAY)}
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /productivity/month
# ---------------------------------------------------------------------------


def test_monthly_empty(client, test_user, test_arena, auth_headers):
    response = client.get(
        "/productivity/month",
        params={"year": 2026, "month": 1},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["year"] == 2026
    assert data["month"] == 1
    assert data["summary"]["total_tasks"] == 0
    assert data["most_productive_day"] is None
    assert len(data["daily_breakdown"]) == 31  # January has 31 days


def test_monthly_february_breakdown_length(client, test_user, test_arena, auth_headers):
    response = client.get(
        "/productivity/month",
        params={"year": 2026, "month": 2},
        headers=auth_headers,
    )
    assert len(response.json()["daily_breakdown"]) == 28  # 2026 is not a leap year


def test_monthly_counts(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, date(2026, 1, 5), is_completed=True, duration=90)
    seed_task(db, test_user.id, test_arena.id, date(2026, 1, 5), is_completed=False)
    seed_task(db, test_user.id, test_arena.id, date(2026, 1, 20), is_completed=True)

    response = client.get(
        "/productivity/month",
        params={"year": 2026, "month": 1},
        headers=auth_headers,
    )
    summary = response.json()["summary"]
    assert summary["total_tasks"] == 3
    assert summary["completed_tasks"] == 2
    assert summary["days_with_tasks"] == 2
    assert summary["total_duration_hours"] == 1.5  # 90 min


def test_monthly_most_productive_day(client, db, test_user, test_arena, auth_headers):
    # Jan 5: 1/2 = 50%
    seed_task(db, test_user.id, test_arena.id, date(2026, 1, 5), is_completed=True)
    seed_task(db, test_user.id, test_arena.id, date(2026, 1, 5), is_completed=False)
    # Jan 10: 2/2 = 100%
    seed_task(db, test_user.id, test_arena.id, date(2026, 1, 10), is_completed=True)
    seed_task(db, test_user.id, test_arena.id, date(2026, 1, 10), is_completed=True)

    response = client.get(
        "/productivity/month",
        params={"year": 2026, "month": 1},
        headers=auth_headers,
    )
    mpd = response.json()["most_productive_day"]
    assert mpd["date"] == "2026-01-10"
    assert mpd["completion_percentage"] == 100.0


def test_monthly_excludes_other_months(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, date(2025, 12, 31))
    seed_task(db, test_user.id, test_arena.id, date(2026, 2, 1))

    response = client.get(
        "/productivity/month",
        params={"year": 2026, "month": 1},
        headers=auth_headers,
    )
    assert response.json()["summary"]["total_tasks"] == 0


def test_monthly_requires_auth(client):
    response = client.get(
        "/productivity/month", params={"year": 2026, "month": 1}
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /productivity/year
# ---------------------------------------------------------------------------


def test_yearly_empty(client, test_user, test_arena, auth_headers):
    response = client.get(
        "/productivity/year", params={"year": 2025}, headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["year"] == 2025
    assert data["summary"]["total_tasks"] == 0
    assert data["best_day"] is None
    assert data["best_month"] is None
    assert len(data["months"]) == 12


def test_yearly_counts(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, date(2025, 3, 1), is_completed=True, duration=60)
    seed_task(db, test_user.id, test_arena.id, date(2025, 6, 15), is_completed=False)

    response = client.get(
        "/productivity/year", params={"year": 2025}, headers=auth_headers
    )
    summary = response.json()["summary"]
    assert summary["total_tasks"] == 2
    assert summary["completed_tasks"] == 1


def test_yearly_best_day(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, date(2025, 3, 1), is_completed=True)
    seed_task(db, test_user.id, test_arena.id, date(2025, 3, 1), is_completed=False)  # 50%
    seed_task(db, test_user.id, test_arena.id, date(2025, 6, 15), is_completed=True)  # 100%

    response = client.get(
        "/productivity/year", params={"year": 2025}, headers=auth_headers
    )
    best = response.json()["best_day"]
    assert best["date"] == "2025-06-15"
    assert best["completion_percentage"] == 100.0


def test_yearly_best_month(client, db, test_user, test_arena, auth_headers):
    # March: 1/2 = 50%
    seed_task(db, test_user.id, test_arena.id, date(2025, 3, 1), is_completed=True)
    seed_task(db, test_user.id, test_arena.id, date(2025, 3, 2), is_completed=False)
    # June: 1/1 = 100%
    seed_task(db, test_user.id, test_arena.id, date(2025, 6, 1), is_completed=True)

    response = client.get(
        "/productivity/year", params={"year": 2025}, headers=auth_headers
    )
    best_month = response.json()["best_month"]
    assert best_month["month"] == 6
    assert best_month["completion_percentage"] == 100.0


def test_yearly_excludes_other_years(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, date(2024, 12, 31))
    seed_task(db, test_user.id, test_arena.id, date(2026, 1, 1))

    response = client.get(
        "/productivity/year", params={"year": 2025}, headers=auth_headers
    )
    assert response.json()["summary"]["total_tasks"] == 0


def test_yearly_requires_auth(client):
    response = client.get("/productivity/year", params={"year": 2025})
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /productivity/streaks
# ---------------------------------------------------------------------------


def test_streaks_no_tasks(client, test_user, test_arena, auth_headers):
    response = client.get("/productivity/streaks", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["current_streak"] == 0
    assert data["longest_streak"] == 0
    assert data["arenas"] == []


def test_streaks_no_completed_tasks(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=False)

    response = client.get("/productivity/streaks", headers=auth_headers)
    data = response.json()
    assert data["longest_streak"] == 0


def test_streaks_longest_consecutive(client, db, test_user, test_arena, auth_headers):
    # 3 consecutive perfect days in the past
    for i in range(3):
        seed_task(
            db, test_user.id, test_arena.id,
            PAST_MONDAY + timedelta(days=i),
            is_completed=True,
        )

    response = client.get("/productivity/streaks", headers=auth_headers)
    assert response.json()["longest_streak"] == 3


def test_streaks_gap_resets_longest(client, db, test_user, test_arena, auth_headers):
    # 2 days, gap, 1 day — longest should be 2
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=True)
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY + timedelta(days=1), is_completed=True)
    # gap on day 2
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY + timedelta(days=3), is_completed=True)

    response = client.get("/productivity/streaks", headers=auth_headers)
    assert response.json()["longest_streak"] == 2


def test_streaks_current_with_today(client, db, test_user, test_arena, auth_headers):
    # A perfect day today → current streak ≥ 1
    seed_task(db, test_user.id, test_arena.id, TODAY, is_completed=True)

    response = client.get("/productivity/streaks", headers=auth_headers)
    assert response.json()["current_streak"] >= 1


def test_streaks_current_consecutive_days(
    client, db, test_user, test_arena, auth_headers
):
    # Yesterday and today both perfect → current streak ≥ 2
    seed_task(db, test_user.id, test_arena.id, YESTERDAY, is_completed=True)
    seed_task(db, test_user.id, test_arena.id, TODAY, is_completed=True)

    response = client.get("/productivity/streaks", headers=auth_headers)
    assert response.json()["current_streak"] >= 2


def test_streaks_per_arena(client, db, test_user, test_arena, auth_headers):
    seed_task(db, test_user.id, test_arena.id, PAST_MONDAY, is_completed=True)

    response = client.get("/productivity/streaks", headers=auth_headers)
    arenas = response.json()["arenas"]
    assert len(arenas) == 1
    assert arenas[0]["arena_id"] == test_arena.id
    assert arenas[0]["longest_streak"] == 1


def test_streaks_excludes_archived_arenas(
    client, db, test_user, test_arena, auth_headers
):
    archived = Arena(
        user_id=test_user.id, name="Dead", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()
    seed_task(db, test_user.id, archived.id, PAST_MONDAY, is_completed=True)

    response = client.get("/productivity/streaks", headers=auth_headers)
    data = response.json()
    # Archived arena tasks should not contribute to streaks
    assert data["longest_streak"] == 0
    assert data["arenas"] == []


def test_streaks_requires_auth(client):
    response = client.get("/productivity/streaks")
    assert response.status_code == 403
