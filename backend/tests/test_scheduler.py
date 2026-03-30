"""
Tests for send_weekly_summaries and send_monthly_summaries.

Strategy: patch SessionLocal in the scheduler module to return the test DB
session, patch datetime.now to control the simulated time, and patch the
email send functions to capture calls without hitting Resend.

Key scenarios:
  - Email fires on the correct day at ANY hour (not just hour 8)
  - Email is NOT sent twice on the same day / same month (dedup guard)
  - Email is NOT sent on the wrong day of week / wrong day of month
  - Email is skipped when user has zero tasks (monthly only)
"""

import pytest
from datetime import date, datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch

from app.models.user import User
from app.models.task import Task
from app.models.arena import Arena
from app.utils.auth import hash_password
from app.services.scheduler import send_weekly_summaries, send_monthly_summaries


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_weekly_user(db, email="weekly@example.com", tz="UTC"):
    user = User(
        first_name="Weekly",
        last_name="User",
        email=email,
        hashed_password=hash_password("pass"),
        is_verified=True,
        weekly_email=True,
        monthly_email=False,
        timezone=tz,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def make_monthly_user(db, email="monthly@example.com", tz="UTC"):
    user = User(
        first_name="Monthly",
        last_name="User",
        email=email,
        hashed_password=hash_password("pass"),
        is_verified=True,
        weekly_email=False,
        monthly_email=True,
        timezone=tz,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed_task(db, user_id, arena_id, due_date, is_completed=True, duration=30):
    task = Task(
        user_id=user_id,
        arena_id=arena_id,
        title="Task",
        frequency="once",
        due_date=due_date,
        is_completed=is_completed,
        is_locked=is_completed,
        duration=duration,
    )
    db.add(task)
    db.commit()
    return task


# ---------------------------------------------------------------------------
# Weekly email tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_weekly_fires_on_sunday_at_any_hour(db, mocker):
    """Email must send on Sunday regardless of the hour — not just at 8am."""
    user = make_weekly_user(db)
    arena = Arena(user_id=user.id, name="Fitness", color="#f97316")
    db.add(arena)
    db.commit()
    seed_task(db, user.id, arena.id, date(2026, 3, 22))  # a Sunday

    # 2026-03-29 is a Sunday — use 10:30 AM (not 8am) to prove hour doesn't matter
    sunday_10am = datetime(2026, 3, 29, 10, 30, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_weekly_summary_email", mock_send):
        mock_dt.now.return_value = sunday_10am
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_weekly_summaries()

    mock_send.assert_called_once()


@pytest.mark.asyncio
async def test_weekly_does_not_fire_on_non_sunday(db, mocker):
    """No email on any day that is not Sunday."""
    user = make_weekly_user(db)

    # 2026-03-30 is a Monday
    monday = datetime(2026, 3, 30, 8, 0, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_weekly_summary_email", mock_send):
        mock_dt.now.return_value = monday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_weekly_summaries()

    mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_weekly_dedup_does_not_send_twice_same_day(db, mocker):
    """If already sent today, do not send again even if it's still Sunday."""
    user = make_weekly_user(db)
    # Mark as already sent today (Sunday 2026-03-29 at 8am)
    user.last_weekly_email_sent = datetime(2026, 3, 29, 8, 0, 0, tzinfo=timezone.utc)
    db.commit()

    # Scheduler runs again at 10:30am same Sunday
    sunday_10am = datetime(2026, 3, 29, 10, 30, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_weekly_summary_email", mock_send):
        mock_dt.now.return_value = sunday_10am
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_weekly_summaries()

    mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_weekly_fires_next_sunday_after_previous_send(db, mocker):
    """Email sent last Sunday must fire again this Sunday."""
    user = make_weekly_user(db)
    arena = Arena(user_id=user.id, name="Work", color="#3b82f6")
    db.add(arena)
    db.commit()
    seed_task(db, user.id, arena.id, date(2026, 3, 22))

    # Last sent: previous Sunday 2026-03-22
    user.last_weekly_email_sent = datetime(2026, 3, 22, 8, 0, 0, tzinfo=timezone.utc)
    db.commit()

    # Now it's the following Sunday 2026-03-29
    sunday = datetime(2026, 3, 29, 9, 0, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_weekly_summary_email", mock_send):
        mock_dt.now.return_value = sunday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_weekly_summaries()

    mock_send.assert_called_once()


@pytest.mark.asyncio
async def test_weekly_skipped_for_unverified_user(db):
    """Unverified users must never receive weekly email."""
    user = make_weekly_user(db)
    user.is_verified = False
    db.commit()

    sunday = datetime(2026, 3, 29, 8, 0, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_weekly_summary_email", mock_send):
        mock_dt.now.return_value = sunday
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_weekly_summaries()

    mock_send.assert_not_called()


# ---------------------------------------------------------------------------
# Monthly email tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_monthly_fires_on_1st_at_any_hour(db):
    """Email must send on the 1st of the month at any hour — not just at 8am."""
    user = make_monthly_user(db)
    arena = Arena(user_id=user.id, name="Fitness", color="#f97316")
    db.add(arena)
    db.commit()
    # Seed a task in the previous month (March 2026) so the report has content
    seed_task(db, user.id, arena.id, date(2026, 3, 15))

    # 2026-04-01 at 14:00 (2pm — not 8am)
    first_2pm = datetime(2026, 4, 1, 14, 0, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_monthly_summary_email", mock_send):
        mock_dt.now.return_value = first_2pm
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_monthly_summaries()

    mock_send.assert_called_once()


@pytest.mark.asyncio
async def test_monthly_does_not_fire_on_non_first(db):
    """No email on any day that is not the 1st."""
    user = make_monthly_user(db)

    # 2026-04-02 — not the 1st
    second = datetime(2026, 4, 2, 8, 0, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_monthly_summary_email", mock_send):
        mock_dt.now.return_value = second
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_monthly_summaries()

    mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_monthly_dedup_does_not_send_twice_same_month(db):
    """If already sent this month, do not send again even if it's still the 1st."""
    user = make_monthly_user(db)
    user.last_monthly_email_sent = datetime(2026, 4, 1, 8, 0, 0, tzinfo=timezone.utc)
    db.commit()

    # Scheduler runs again at 2pm on the same 1st
    first_2pm = datetime(2026, 4, 1, 14, 0, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_monthly_summary_email", mock_send):
        mock_dt.now.return_value = first_2pm
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_monthly_summaries()

    mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_monthly_skipped_when_zero_tasks(db):
    """No email if the user had zero activity last month."""
    user = make_monthly_user(db)

    first = datetime(2026, 4, 1, 9, 0, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_monthly_summary_email", mock_send):
        mock_dt.now.return_value = first
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_monthly_summaries()

    mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_monthly_fires_next_month_after_previous_send(db):
    """Email sent last month must fire again on the 1st of the new month."""
    user = make_monthly_user(db)
    arena = Arena(user_id=user.id, name="Work", color="#3b82f6")
    db.add(arena)
    db.commit()
    seed_task(db, user.id, arena.id, date(2026, 3, 10))

    # Last sent: March 1st (for February's report)
    user.last_monthly_email_sent = datetime(2026, 3, 1, 8, 0, 0, tzinfo=timezone.utc)
    db.commit()

    # Now it's April 1st (for March's report)
    april_first = datetime(2026, 4, 1, 9, 0, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_monthly_summary_email", mock_send):
        mock_dt.now.return_value = april_first
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_monthly_summaries()

    mock_send.assert_called_once()


@pytest.mark.asyncio
async def test_monthly_fires_same_month_different_year(db):
    """Dec 1 2025 send must NOT block Dec 1 2026 — dedup checks year+month, not month alone."""
    user = make_monthly_user(db)
    arena = Arena(user_id=user.id, name="Work", color="#3b82f6")
    db.add(arena)
    db.commit()
    seed_task(db, user.id, arena.id, date(2026, 11, 15))

    # Last sent: Dec 1 2025 (for November 2025's report)
    user.last_monthly_email_sent = datetime(2025, 12, 1, 8, 0, 0, tzinfo=timezone.utc)
    db.commit()

    # Now it's Dec 1 2026 (for November 2026's report) — same month, different year
    dec_first_2026 = datetime(2026, 12, 1, 9, 0, 0, tzinfo=timezone.utc)

    mock_send = AsyncMock()
    with patch("app.services.scheduler.SessionLocal", return_value=db), \
         patch("app.services.scheduler.datetime") as mock_dt, \
         patch("app.services.scheduler.send_monthly_summary_email", mock_send):
        mock_dt.now.return_value = dec_first_2026
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        await send_monthly_summaries()

    mock_send.assert_called_once()
