from datetime import date, timedelta

import pytest

from app.models.arena import Arena
from app.models.task import Task
from app.models.user import User
from app.utils.auth import hash_password, create_access_token

TASKS_URL = "/tasks/"

TODAY = date.today()
TOMORROW = TODAY + timedelta(days=1)
YESTERDAY = TODAY - timedelta(days=1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def task_url(task_id: int) -> str:
    return f"/tasks/{task_id}"


def series_url(task_id: int) -> str:
    return f"/tasks/{task_id}/series"


def make_task(db, user_id: int, arena_id: int, **kwargs) -> Task:
    defaults = dict(
        title="Sample Task",
        frequency="once",
        due_date=TOMORROW,
        is_completed=False,
        is_locked=False,
    )
    defaults.update(kwargs)
    task = Task(user_id=user_id, arena_id=arena_id, **defaults)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


# ---------------------------------------------------------------------------
# POST /tasks/
# ---------------------------------------------------------------------------


def test_create_task_once(client, test_user, test_arena, auth_headers, db):
    response = client.post(
        TASKS_URL,
        json={
            "title": "Read a book",
            "frequency": "once",
            "due_date": str(TOMORROW),
            "arena_id": test_arena.id,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Read a book"
    assert data["frequency"] == "once"
    assert data["group_id"] is None
    assert data["arena"]["id"] == test_arena.id

    # Exactly one task created in DB
    tasks = db.query(Task).filter(Task.user_id == test_user.id).all()
    assert len(tasks) == 1


def test_create_task_recurring_generates_multiple(
    client, test_user, test_arena, auth_headers, db
):
    response = client.post(
        TASKS_URL,
        json={
            "title": "Monthly review",
            "frequency": "monthly",
            "due_date": str(TOMORROW),
            "arena_id": test_arena.id,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["group_id"] is not None  # recurring tasks share a group_id

    tasks = db.query(Task).filter(Task.user_id == test_user.id).all()
    assert len(tasks) > 1  # monthly over 1 year → ~12-13 tasks


def test_create_task_invalid_arena(client, test_user, auth_headers):
    response = client.post(
        TASKS_URL,
        json={
            "title": "Ghost task",
            "frequency": "once",
            "due_date": str(TOMORROW),
            "arena_id": 9999,
        },
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_create_task_archived_arena_rejected(
    client, db, test_user, auth_headers
):
    archived = Arena(
        user_id=test_user.id, name="Archived", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()

    response = client.post(
        TASKS_URL,
        json={
            "title": "Sneaky task",
            "frequency": "once",
            "due_date": str(TOMORROW),
            "arena_id": archived.id,
        },
        headers=auth_headers,
    )
    assert response.status_code == 409


def test_create_task_requires_auth(client, test_arena):
    response = client.post(
        TASKS_URL,
        json={
            "title": "No auth",
            "frequency": "once",
            "due_date": str(TOMORROW),
            "arena_id": test_arena.id,
        },
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /tasks/
# ---------------------------------------------------------------------------


def test_get_tasks_empty(client, test_user, auth_headers):
    response = client.get(TASKS_URL, headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_get_tasks_returns_own_tasks(client, db, test_user, test_arena, auth_headers):
    make_task(db, test_user.id, test_arena.id, title="My Task")
    response = client.get(TASKS_URL, headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "My Task"


def test_get_tasks_excludes_other_users(client, db, test_user, test_arena, auth_headers):
    other = User(
        first_name="Other",
        last_name="User",
        email="other@example.com",
        hashed_password=hash_password("pass"),
    )
    db.add(other)
    db.commit()
    other_arena = Arena(user_id=other.id, name="Other Arena", color="#fff")
    db.add(other_arena)
    db.commit()
    make_task(db, other.id, other_arena.id, title="Their task")

    response = client.get(TASKS_URL, headers=auth_headers)
    assert response.json() == []


def test_get_tasks_filter_by_status_completed(
    client, db, test_user, test_arena, auth_headers
):
    make_task(db, test_user.id, test_arena.id, title="Done", is_completed=True)
    make_task(db, test_user.id, test_arena.id, title="Pending", is_completed=False)

    response = client.get(TASKS_URL, params={"status": "true"}, headers=auth_headers)
    assert response.status_code == 200
    titles = [t["title"] for t in response.json()]
    assert "Done" in titles
    assert "Pending" not in titles


def test_get_tasks_filter_by_status_incomplete(
    client, db, test_user, test_arena, auth_headers
):
    make_task(db, test_user.id, test_arena.id, title="Done", is_completed=True)
    make_task(db, test_user.id, test_arena.id, title="Pending", is_completed=False)

    response = client.get(TASKS_URL, params={"status": "false"}, headers=auth_headers)
    titles = [t["title"] for t in response.json()]
    assert "Pending" in titles
    assert "Done" not in titles


def test_get_tasks_filter_by_due_date(
    client, db, test_user, test_arena, auth_headers
):
    make_task(db, test_user.id, test_arena.id, title="Today", due_date=TODAY)
    make_task(db, test_user.id, test_arena.id, title="Tomorrow", due_date=TOMORROW)

    response = client.get(
        TASKS_URL, params={"due_date": str(TODAY)}, headers=auth_headers
    )
    titles = [t["title"] for t in response.json()]
    assert "Today" in titles
    assert "Tomorrow" not in titles


def test_get_tasks_locks_overdue(client, db, test_user, test_arena, auth_headers):
    overdue = make_task(
        db, test_user.id, test_arena.id, due_date=YESTERDAY, is_locked=False
    )
    response = client.get(TASKS_URL, headers=auth_headers)
    assert response.status_code == 200
    task_data = next(t for t in response.json() if t["id"] == overdue.id)
    assert task_data["is_locked"] is True


# ---------------------------------------------------------------------------
# PUT /tasks/{id}
# ---------------------------------------------------------------------------


def test_update_task_title(client, db, test_user, test_arena, auth_headers):
    task = make_task(db, test_user.id, test_arena.id)
    response = client.put(
        task_url(task.id), json={"title": "Updated"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated"


def test_update_task_not_found(client, test_user, auth_headers):
    response = client.put(task_url(9999), json={"title": "Ghost"}, headers=auth_headers)
    assert response.status_code == 404


def test_update_task_wrong_user(client, db, test_arena, auth_headers):
    other = User(
        first_name="Other",
        last_name="User",
        email="other@example.com",
        hashed_password=hash_password("pass"),
    )
    db.add(other)
    db.commit()
    task = make_task(db, other.id, test_arena.id)

    response = client.put(
        task_url(task.id), json={"title": "Stolen"}, headers=auth_headers
    )
    assert response.status_code == 403


def test_update_locked_task_rejected(client, db, test_user, test_arena, auth_headers):
    task = make_task(db, test_user.id, test_arena.id, is_locked=True)
    response = client.put(
        task_url(task.id), json={"title": "Try anyway"}, headers=auth_headers
    )
    assert response.status_code == 423


def test_update_task_move_to_different_arena(
    client, db, test_user, test_arena, auth_headers
):
    second = Arena(user_id=test_user.id, name="Second", color="#fff")
    db.add(second)
    db.commit()
    task = make_task(db, test_user.id, test_arena.id)

    response = client.put(
        task_url(task.id), json={"arena_id": second.id}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["arena"]["id"] == second.id


def test_update_task_move_to_archived_arena_rejected(
    client, db, test_user, test_arena, auth_headers
):
    archived = Arena(
        user_id=test_user.id, name="Archived", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()
    task = make_task(db, test_user.id, test_arena.id)

    response = client.put(
        task_url(task.id), json={"arena_id": archived.id}, headers=auth_headers
    )
    assert response.status_code == 409


# ---------------------------------------------------------------------------
# DELETE /tasks/{id}
# ---------------------------------------------------------------------------


def test_delete_task_success(client, db, test_user, test_arena, auth_headers):
    task = make_task(db, test_user.id, test_arena.id)
    response = client.delete(task_url(task.id), headers=auth_headers)
    assert response.status_code == 204
    assert db.query(Task).filter(Task.id == task.id).first() is None


def test_delete_task_not_found(client, test_user, auth_headers):
    response = client.delete(task_url(9999), headers=auth_headers)
    assert response.status_code == 404


def test_delete_locked_task_rejected(client, db, test_user, test_arena, auth_headers):
    task = make_task(db, test_user.id, test_arena.id, is_locked=True)
    response = client.delete(task_url(task.id), headers=auth_headers)
    assert response.status_code == 423


def test_delete_task_wrong_user(client, db, test_arena, auth_headers):
    other = User(
        first_name="Other",
        last_name="User",
        email="other2@example.com",
        hashed_password=hash_password("pass"),
    )
    db.add(other)
    db.commit()
    task = make_task(db, other.id, test_arena.id)

    response = client.delete(task_url(task.id), headers=auth_headers)
    # Route checks is_locked before ownership, so unlocked task → 403
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# PATCH /tasks/{id}  (toggle completion)
# ---------------------------------------------------------------------------


def test_toggle_completion_on(client, db, test_user, test_arena, auth_headers):
    task = make_task(db, test_user.id, test_arena.id, is_completed=False)
    response = client.patch(task_url(task.id), headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["is_completed"] is True


def test_toggle_completion_off(client, db, test_user, test_arena, auth_headers):
    task = make_task(db, test_user.id, test_arena.id, is_completed=True)
    response = client.patch(task_url(task.id), headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["is_completed"] is False


def test_toggle_locked_task_rejected(client, db, test_user, test_arena, auth_headers):
    task = make_task(db, test_user.id, test_arena.id, is_locked=True)
    response = client.patch(task_url(task.id), headers=auth_headers)
    assert response.status_code == 423


def test_toggle_wrong_user_rejected(client, db, test_arena, auth_headers):
    other = User(
        first_name="Other",
        last_name="User",
        email="other3@example.com",
        hashed_password=hash_password("pass"),
    )
    db.add(other)
    db.commit()
    task = make_task(db, other.id, test_arena.id)

    response = client.patch(task_url(task.id), headers=auth_headers)
    assert response.status_code == 403


def test_toggle_task_not_found(client, test_user, auth_headers):
    response = client.patch(task_url(9999), headers=auth_headers)
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /tasks/{id}/series
# ---------------------------------------------------------------------------


def test_delete_series_removes_incomplete_future_tasks(
    client, db, test_user, test_arena, auth_headers
):
    import uuid

    group = str(uuid.uuid4())
    # 3 future incomplete tasks in series
    t1 = make_task(
        db, test_user.id, test_arena.id, due_date=TOMORROW, group_id=group
    )
    make_task(
        db,
        test_user.id,
        test_arena.id,
        due_date=TOMORROW + timedelta(days=7),
        group_id=group,
    )
    make_task(
        db,
        test_user.id,
        test_arena.id,
        due_date=TOMORROW + timedelta(days=14),
        group_id=group,
    )
    # 1 already completed — should NOT be deleted
    make_task(
        db,
        test_user.id,
        test_arena.id,
        due_date=TOMORROW + timedelta(days=21),
        group_id=group,
        is_completed=True,
    )

    response = client.delete(series_url(t1.id), headers=auth_headers)
    assert response.status_code == 204

    remaining = db.query(Task).filter(Task.group_id == group).all()
    assert len(remaining) == 1  # only the completed one survives
    assert remaining[0].is_completed is True


def test_delete_series_non_recurring_task_rejected(
    client, db, test_user, test_arena, auth_headers
):
    task = make_task(db, test_user.id, test_arena.id)  # group_id=None
    response = client.delete(series_url(task.id), headers=auth_headers)
    assert response.status_code == 400
    assert "not part of a series" in response.json()["detail"]


def test_delete_series_task_not_found(client, test_user, auth_headers):
    response = client.delete(series_url(9999), headers=auth_headers)
    assert response.status_code == 404


def test_delete_series_keeps_past_and_locked_tasks(
    client, db, test_user, test_arena, auth_headers
):
    import uuid

    group = str(uuid.uuid4())
    # 1 past locked task — should survive
    past_locked = make_task(
        db, test_user.id, test_arena.id,
        due_date=YESTERDAY,
        group_id=group,
        is_locked=True,
        is_completed=False,
    )
    # 1 future incomplete task — should be deleted
    future = make_task(
        db, test_user.id, test_arena.id,
        due_date=TOMORROW,
        group_id=group,
    )

    response = client.delete(series_url(future.id), headers=auth_headers)
    assert response.status_code == 204

    remaining = db.query(Task).filter(Task.group_id == group).all()
    assert len(remaining) == 1
    assert remaining[0].id == past_locked.id


# ---------------------------------------------------------------------------
# PUT /tasks/{id}  — additional edge cases
# ---------------------------------------------------------------------------


def test_update_task_in_archived_arena_rejected(
    client, db, test_user, auth_headers
):
    """Task whose current arena is archived cannot be updated."""
    from app.models.arena import Arena

    archived = Arena(
        user_id=test_user.id, name="Dead", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()
    task = make_task(db, test_user.id, archived.id)

    response = client.put(
        task_url(task.id), json={"title": "Try anyway"}, headers=auth_headers
    )
    assert response.status_code == 409
