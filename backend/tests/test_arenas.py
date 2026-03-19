from datetime import date

import pytest

from app.models.arena import Arena
from app.models.user import User
from app.utils.auth import hash_password

ARENAS_URL = "/arenas/"
ARCHIVED_URL = "/arenas/archived"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def arena_url(arena_id: int) -> str:
    return f"/arenas/{arena_id}"


def color_url(arena_id: int) -> str:
    return f"/arenas/{arena_id}/color"


def restore_url(arena_id: int) -> str:
    return f"/arenas/{arena_id}/restore"


# ---------------------------------------------------------------------------
# GET /arenas/
# ---------------------------------------------------------------------------


def test_get_arenas_empty(client, test_user, auth_headers):
    response = client.get(ARENAS_URL, headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_get_arenas_returns_only_active(client, db, test_user, auth_headers):
    active = Arena(user_id=test_user.id, name="Active", color="#fff")
    archived = Arena(
        user_id=test_user.id, name="Archived", color="#fff", is_archived=True
    )
    db.add_all([active, archived])
    db.commit()

    response = client.get(ARENAS_URL, headers=auth_headers)
    assert response.status_code == 200
    names = [a["name"] for a in response.json()]
    assert "Active" in names
    assert "Archived" not in names


def test_get_arenas_excludes_other_users(client, db, test_user, auth_headers):
    other = User(
        first_name="Other",
        last_name="User",
        email="other@example.com",
        hashed_password=hash_password("pass"),
    )
    db.add(other)
    db.commit()
    db.add(Arena(user_id=other.id, name="Other's Arena", color="#fff"))
    db.commit()

    response = client.get(ARENAS_URL, headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_get_arenas_requires_auth(client):
    response = client.get(ARENAS_URL)
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# GET /arenas/archived
# ---------------------------------------------------------------------------


def test_get_archived_arenas_empty(client, test_user, auth_headers):
    response = client.get(ARCHIVED_URL, headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_get_archived_arenas_returns_only_archived(
    client, db, test_user, auth_headers
):
    Arena(user_id=test_user.id, name="Active", color="#fff")
    db.add(Arena(user_id=test_user.id, name="Active", color="#fff"))
    db.add(
        Arena(
            user_id=test_user.id, name="Archived", color="#fff", is_archived=True
        )
    )
    db.commit()

    response = client.get(ARCHIVED_URL, headers=auth_headers)
    assert response.status_code == 200
    names = [a["name"] for a in response.json()]
    assert "Archived" in names
    assert "Active" not in names


# ---------------------------------------------------------------------------
# POST /arenas/
# ---------------------------------------------------------------------------


def test_create_arena_success(client, test_user, auth_headers):
    response = client.post(
        ARENAS_URL, json={"name": "Fitness", "color": "#f97316"}, headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Fitness"
    assert data["color"] == "#f97316"
    assert data["is_archived"] is False


def test_create_arena_default_color(client, test_user, auth_headers):
    response = client.post(
        ARENAS_URL, json={"name": "No Color"}, headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["color"] == "#f97316"


def test_create_arena_limit(client, db, test_user, auth_headers):
    for i in range(10):
        db.add(Arena(user_id=test_user.id, name=f"Arena {i}", color="#fff"))
    db.commit()

    response = client.post(
        ARENAS_URL, json={"name": "One Too Many"}, headers=auth_headers
    )
    assert response.status_code == 400
    assert "limit" in response.json()["detail"]


def test_create_arena_requires_auth(client):
    response = client.post(ARENAS_URL, json={"name": "Test"})
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# PUT /arenas/{id}
# ---------------------------------------------------------------------------


def test_update_arena_name(client, test_arena, auth_headers):
    response = client.put(
        arena_url(test_arena.id),
        json={"name": "Renamed"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Renamed"


def test_update_arena_color(client, test_arena, auth_headers):
    response = client.put(
        arena_url(test_arena.id),
        json={"color": "#000000"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["color"] == "#000000"


def test_update_arena_not_found(client, test_user, auth_headers):
    response = client.put(
        arena_url(9999), json={"name": "Ghost"}, headers=auth_headers
    )
    assert response.status_code == 404


def test_update_archived_arena_rejected(client, db, test_user, auth_headers):
    archived = Arena(
        user_id=test_user.id, name="Old", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()

    response = client.put(
        arena_url(archived.id), json={"name": "New"}, headers=auth_headers
    )
    assert response.status_code == 409


def test_update_arena_other_user_returns_404(client, db, auth_headers):
    other = User(
        first_name="Other",
        last_name="User",
        email="other@example.com",
        hashed_password=hash_password("pass"),
    )
    db.add(other)
    db.commit()
    arena = Arena(user_id=other.id, name="Theirs", color="#fff")
    db.add(arena)
    db.commit()

    response = client.put(
        arena_url(arena.id), json={"name": "Stolen"}, headers=auth_headers
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /arenas/{id}/color
# ---------------------------------------------------------------------------


def test_update_color_success(client, test_arena, auth_headers):
    response = client.patch(
        color_url(test_arena.id), json={"color": "#ff0000"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["color"] == "#ff0000"


def test_update_color_archived_rejected(client, db, test_user, auth_headers):
    archived = Arena(
        user_id=test_user.id, name="Old", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()

    response = client.patch(
        color_url(archived.id), json={"color": "#ff0000"}, headers=auth_headers
    )
    assert response.status_code == 409


def test_update_color_not_found(client, test_user, auth_headers):
    response = client.patch(
        color_url(9999), json={"color": "#ff0000"}, headers=auth_headers
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /arenas/{id}  (archives, not hard delete)
# ---------------------------------------------------------------------------


def test_delete_arena_archives_it(client, db, test_arena, auth_headers):
    response = client.delete(arena_url(test_arena.id), headers=auth_headers)
    assert response.status_code == 204

    db.refresh(test_arena)
    assert test_arena.is_archived is True


def test_delete_already_archived_rejected(client, db, test_user, auth_headers):
    archived = Arena(
        user_id=test_user.id, name="Old", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()

    response = client.delete(arena_url(archived.id), headers=auth_headers)
    assert response.status_code == 409


def test_delete_arena_not_found(client, test_user, auth_headers):
    response = client.delete(arena_url(9999), headers=auth_headers)
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# POST /arenas/{id}/restore
# ---------------------------------------------------------------------------


def test_restore_arena_success(client, db, test_user, auth_headers):
    archived = Arena(
        user_id=test_user.id, name="Comeback", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()

    response = client.post(restore_url(archived.id), headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["is_archived"] is False


def test_restore_arena_not_archived_rejected(client, test_arena, auth_headers):
    response = client.post(restore_url(test_arena.id), headers=auth_headers)
    assert response.status_code == 409


def test_restore_arena_not_found(client, test_user, auth_headers):
    response = client.post(restore_url(9999), headers=auth_headers)
    assert response.status_code == 404


def test_restore_arena_respects_limit(client, db, test_user, auth_headers):
    # Fill up to the limit with active arenas
    for i in range(10):
        db.add(Arena(user_id=test_user.id, name=f"Arena {i}", color="#fff"))
    archived = Arena(
        user_id=test_user.id, name="Waiting", color="#fff", is_archived=True
    )
    db.add(archived)
    db.commit()

    response = client.post(restore_url(archived.id), headers=auth_headers)
    assert response.status_code == 400
    assert "limit" in response.json()["detail"]
