from datetime import datetime, timedelta

import pytest

from app.models.arena import Arena

REGISTER_URL = "/auth/register"
LOGIN_URL = "/auth/login"
ME_URL = "/auth/me"
FORGOT_PASSWORD_URL = "/auth/forgot-password"
RESET_PASSWORD_URL = "/auth/reset-password"
VERIFY_EMAIL_URL = "/auth/verify-email"
RESEND_VERIFICATION_URL = "/auth/resend-verification"

VALID_USER = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "securepass123",
}


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------


def test_register_success(client, mocker):
    mocker.patch("app.routes.auth.send_verification_email")
    response = client.post(REGISTER_URL, json=VALID_USER)
    assert response.status_code == 201
    assert "message" in response.json()


def test_register_sends_verification_email(client, db, mocker):
    mock_send = mocker.patch("app.routes.auth.send_verification_email")
    client.post(REGISTER_URL, json=VALID_USER)
    assert mock_send.called
    from app.models.user import User
    user = db.query(User).filter(User.email == VALID_USER["email"]).first()
    assert user.is_verified is False
    assert user.verification_token is not None


def test_register_creates_default_arenas(client, db):
    client.post(REGISTER_URL, json=VALID_USER)

    from app.models.user import User

    user = db.query(User).filter(User.email == VALID_USER["email"]).first()
    arenas = db.query(Arena).filter(Arena.user_id == user.id).all()
    assert len(arenas) == 6


def test_register_duplicate_email(client, test_user):
    response = client.post(
        REGISTER_URL,
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "email": test_user.email,
            "password": "anotherpass",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------


def test_login_success(client, test_user):
    response = client.post(
        LOGIN_URL, json={"email": test_user.email, "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    response = client.post(
        LOGIN_URL, json={"email": test_user.email, "password": "wrongpass"}
    )
    assert response.status_code == 401


def test_login_nonexistent_email(client):
    response = client.post(
        LOGIN_URL, json={"email": "nobody@example.com", "password": "pass"}
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------


def test_get_me(client, test_user, auth_headers):
    response = client.get(ME_URL, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["first_name"] == test_user.first_name


def test_get_me_no_token(client):
    # HTTPBearer returns 403 when the Authorization header is absent
    response = client.get(ME_URL)
    assert response.status_code == 403


def test_get_me_invalid_token(client):
    response = client.get(ME_URL, headers={"Authorization": "Bearer badtoken"})
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# PUT /auth/me
# ---------------------------------------------------------------------------


def test_update_name(client, test_user, auth_headers):
    response = client.put(
        ME_URL, json={"first_name": "Updated"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["first_name"] == "Updated"


def test_update_last_name(client, test_user, auth_headers):
    response = client.put(
        ME_URL, json={"last_name": "Smith"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["last_name"] == "Smith"


def test_update_email(client, test_user, auth_headers):
    response = client.put(
        ME_URL, json={"email": "newemail@example.com"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["email"] == "newemail@example.com"


def test_update_email_already_taken(client, db, test_user, auth_headers):
    from app.models.user import User
    from app.utils.auth import hash_password

    other = User(
        first_name="Other",
        last_name="User",
        email="other@example.com",
        hashed_password=hash_password("pass"),
    )
    db.add(other)
    db.commit()

    response = client.put(
        ME_URL, json={"email": "other@example.com"}, headers=auth_headers
    )
    assert response.status_code == 400


def test_update_password_success(client, test_user, auth_headers):
    response = client.put(
        ME_URL,
        json={"current_password": "password123", "new_password": "newpass456"},
        headers=auth_headers,
    )
    assert response.status_code == 200

    # Verify the new password actually works for login
    login = client.post(
        LOGIN_URL, json={"email": test_user.email, "password": "newpass456"}
    )
    assert login.status_code == 200


def test_update_password_wrong_current(client, test_user, auth_headers):
    response = client.put(
        ME_URL,
        json={"current_password": "wrongpass", "new_password": "newpass456"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_update_password_missing_current(client, test_user, auth_headers):
    response = client.put(
        ME_URL, json={"new_password": "newpass456"}, headers=auth_headers
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Forgot password
# ---------------------------------------------------------------------------


def test_forgot_password_known_email(client, test_user, mocker):
    mocker.patch("app.routes.auth.send_password_reset_email")
    response = client.post(FORGOT_PASSWORD_URL, json={"email": test_user.email})
    assert response.status_code == 200
    assert "reset link" in response.json()["message"]


def test_forgot_password_unknown_email(client):
    # Should return same message regardless — don't reveal whether email exists
    response = client.post(
        FORGOT_PASSWORD_URL, json={"email": "nobody@example.com"}
    )
    assert response.status_code == 200
    assert "reset link" in response.json()["message"]


def test_forgot_password_sets_token(client, test_user, db, mocker):
    mocker.patch("app.routes.auth.send_password_reset_email")
    client.post(FORGOT_PASSWORD_URL, json={"email": test_user.email})

    db.refresh(test_user)
    assert test_user.reset_token is not None
    assert test_user.reset_token_expires is not None


# ---------------------------------------------------------------------------
# Reset password
#
# SQLite returns naive datetimes, but the route compares with
# datetime.now(timezone.utc) (aware). We patch datetime.now in the route
# module so both sides of the comparison are naive, avoiding TypeError.
# ---------------------------------------------------------------------------


def test_reset_password_success(client, test_user, db, mocker):
    now_naive = datetime(2026, 3, 19, 12, 0, 0)
    mock_dt = mocker.patch("app.routes.auth.datetime")
    mock_dt.now.return_value = now_naive

    test_user.reset_token = "validtoken"
    test_user.reset_token_expires = datetime(2026, 3, 19, 12, 5, 0)  # 5 min later
    db.commit()

    response = client.post(
        RESET_PASSWORD_URL,
        json={"token": "validtoken", "new_password": "brandnewpass"},
    )
    assert response.status_code == 200
    assert "successfully reset" in response.json()["message"]

    db.refresh(test_user)
    assert test_user.reset_token is None
    assert test_user.reset_token_expires is None


def test_reset_password_invalid_token(client):
    response = client.post(
        RESET_PASSWORD_URL,
        json={"token": "doesnotexist", "new_password": "newpassword123"},
    )
    assert response.status_code == 400


def test_reset_password_expired_token(client, test_user, db, mocker):
    now_naive = datetime(2026, 3, 19, 12, 0, 0)
    mock_dt = mocker.patch("app.routes.auth.datetime")
    mock_dt.now.return_value = now_naive

    test_user.reset_token = "expiredtoken"
    test_user.reset_token_expires = datetime(2026, 3, 19, 11, 55, 0)  # 5 min ago
    db.commit()

    response = client.post(
        RESET_PASSWORD_URL,
        json={"token": "expiredtoken", "new_password": "newpassword123"},
    )
    assert response.status_code == 400
    assert "expired" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Login blocked for unverified users
# ---------------------------------------------------------------------------


def test_login_blocked_if_unverified(client, db):
    from app.models.user import User
    from app.utils.auth import hash_password

    unverified = User(
        first_name="Unverified",
        last_name="User",
        email="unverified@example.com",
        hashed_password=hash_password("password123"),
        is_verified=False,
    )
    db.add(unverified)
    db.commit()

    response = client.post(
        LOGIN_URL, json={"email": "unverified@example.com", "password": "password123"}
    )
    assert response.status_code == 403
    assert "not verified" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------


def test_verify_email_success(client, test_user, db, mocker):
    now_naive = datetime(2026, 3, 19, 12, 0, 0)
    mock_dt = mocker.patch("app.routes.auth.datetime")
    mock_dt.now.return_value = now_naive

    test_user.is_verified = False
    test_user.verification_token = "validverifytoken"
    test_user.verification_token_expires = datetime(2026, 3, 20, 12, 0, 0)  # 24h later
    db.commit()

    response = client.post(f"{VERIFY_EMAIL_URL}?token=validverifytoken")
    assert response.status_code == 200
    assert "access_token" in response.json()

    db.refresh(test_user)
    assert test_user.is_verified is True
    assert test_user.verification_token is None


def test_verify_email_invalid_token(client):
    response = client.post(f"{VERIFY_EMAIL_URL}?token=doesnotexist")
    assert response.status_code == 400


def test_verify_email_expired_token(client, test_user, db, mocker):
    now_naive = datetime(2026, 3, 19, 12, 0, 0)
    mock_dt = mocker.patch("app.routes.auth.datetime")
    mock_dt.now.return_value = now_naive

    test_user.is_verified = False
    test_user.verification_token = "expiredverifytoken"
    test_user.verification_token_expires = datetime(2026, 3, 18, 12, 0, 0)  # yesterday
    db.commit()

    response = client.post(f"{VERIFY_EMAIL_URL}?token=expiredverifytoken")
    assert response.status_code == 400
    assert "expired" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Resend verification
# ---------------------------------------------------------------------------


def test_resend_verification_sends_email(client, db, mocker):
    from app.models.user import User
    from app.utils.auth import hash_password

    mock_send = mocker.patch("app.routes.auth.send_verification_email")
    unverified = User(
        first_name="Un",
        last_name="Verified",
        email="resend@example.com",
        hashed_password=hash_password("pass"),
        is_verified=False,
        verification_token="oldtoken",
        verification_token_expires=datetime(2026, 3, 18, 0, 0, 0),
    )
    db.add(unverified)
    db.commit()

    response = client.post(RESEND_VERIFICATION_URL, json={"email": "resend@example.com"})
    assert response.status_code == 200
    assert mock_send.called

    db.refresh(unverified)
    assert unverified.verification_token != "oldtoken"


def test_resend_verification_already_verified_is_silent(client, test_user, mocker):
    mock_send = mocker.patch("app.routes.auth.send_verification_email")
    response = client.post(RESEND_VERIFICATION_URL, json={"email": test_user.email})
    assert response.status_code == 200
    assert not mock_send.called


def test_resend_verification_unknown_email_is_silent(client, mocker):
    mock_send = mocker.patch("app.routes.auth.send_verification_email")
    response = client.post(RESEND_VERIFICATION_URL, json={"email": "ghost@example.com"})
    assert response.status_code == 200
    assert not mock_send.called
