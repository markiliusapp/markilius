import json
from unittest.mock import MagicMock

import pytest
from stripe import InvalidRequestError, SignatureVerificationError

from app.models.user import User
from app.utils.auth import create_access_token

CHECKOUT_URL = "/payments/checkout"
UPGRADE_URL = "/payments/upgrade-to-lifetime"
WEBHOOK_URL = "/payments/webhook"
VERIFY_URL = "/payments/verify-session"
PORTAL_URL = "/payments/portal"

MOCK_PRICE_IDS = {
    "monthly": "price_monthly_123",
    "yearly": "price_yearly_123",
    "lifetime": "price_lifetime_123",
}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def free_user(db):
    user = User(
        first_name="Free",
        last_name="User",
        email="free@example.com",
        hashed_password="hashed",
        is_verified=True,
        subscription_status="inactive",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def free_headers(free_user):
    token = create_access_token(data={"sub": str(free_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def active_user(db):
    user = User(
        first_name="Active",
        last_name="User",
        email="active@example.com",
        hashed_password="hashed",
        is_verified=True,
        subscription_status="active",
        subscription_tier="monthly",
        stripe_customer_id="cus_active123",
        stripe_subscription_id="sub_active123",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def active_headers(active_user):
    token = create_access_token(data={"sub": str(active_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def lifetime_user(db):
    user = User(
        first_name="Lifetime",
        last_name="User",
        email="lifetime@example.com",
        hashed_password="hashed",
        is_verified=True,
        subscription_status="lifetime",
        subscription_tier="lifetime",
        stripe_customer_id="cus_lifetime123",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def lifetime_headers(lifetime_user):
    token = create_access_token(data={"sub": str(lifetime_user.id)})
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# POST /payments/checkout
# ---------------------------------------------------------------------------


def test_checkout_invalid_plan(client, free_headers):
    response = client.post(f"{CHECKOUT_URL}?plan=invalid", headers=free_headers)
    assert response.status_code == 400
    assert "Invalid plan" in response.json()["detail"]


def test_checkout_plan_not_configured(client, free_headers, mocker):
    mocker.patch.dict(
        "app.routes.payments.PRICE_IDS",
        {"monthly": None, "yearly": None, "lifetime": None},
    )
    response = client.post(f"{CHECKOUT_URL}?plan=monthly", headers=free_headers)
    assert response.status_code == 500
    assert "not configured" in response.json()["detail"]


def test_checkout_already_lifetime_rejected(client, lifetime_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    response = client.post(f"{CHECKOUT_URL}?plan=monthly", headers=lifetime_headers)
    assert response.status_code == 400
    assert "lifetime" in response.json()["detail"]


def test_checkout_already_active_rejected(client, active_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    response = client.post(f"{CHECKOUT_URL}?plan=monthly", headers=active_headers)
    assert response.status_code == 400
    assert "active subscription" in response.json()["detail"]


def test_checkout_creates_new_stripe_customer(client, db, free_user, free_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mocker.patch("stripe.Customer.create", return_value=MagicMock(id="cus_new123"))
    mocker.patch(
        "stripe.checkout.Session.create",
        return_value=MagicMock(url="https://checkout.stripe.com/pay/cs_test_123"),
    )

    response = client.post(f"{CHECKOUT_URL}?plan=monthly", headers=free_headers)

    assert response.status_code == 200
    assert response.json()["url"] == "https://checkout.stripe.com/pay/cs_test_123"
    db.refresh(free_user)
    assert free_user.stripe_customer_id == "cus_new123"


def test_checkout_reuses_existing_customer(client, db, free_user, free_headers, mocker):
    free_user.stripe_customer_id = "cus_existing123"
    db.commit()

    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mock_create_customer = mocker.patch("stripe.Customer.create")
    mocker.patch(
        "stripe.checkout.Session.create",
        return_value=MagicMock(url="https://checkout.stripe.com/pay/cs_test_456"),
    )

    response = client.post(f"{CHECKOUT_URL}?plan=monthly", headers=free_headers)

    assert response.status_code == 200
    mock_create_customer.assert_not_called()


def test_checkout_lifetime_uses_payment_mode(client, free_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mocker.patch("stripe.Customer.create", return_value=MagicMock(id="cus_new"))
    mock_session_create = mocker.patch(
        "stripe.checkout.Session.create", return_value=MagicMock(url="https://x")
    )

    client.post(f"{CHECKOUT_URL}?plan=lifetime", headers=free_headers)

    assert mock_session_create.call_args[1]["mode"] == "payment"


def test_checkout_monthly_uses_subscription_mode(client, free_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mocker.patch("stripe.Customer.create", return_value=MagicMock(id="cus_new"))
    mock_session_create = mocker.patch(
        "stripe.checkout.Session.create", return_value=MagicMock(url="https://x")
    )

    client.post(f"{CHECKOUT_URL}?plan=monthly", headers=free_headers)

    assert mock_session_create.call_args[1]["mode"] == "subscription"


def test_checkout_requires_auth(client):
    response = client.post(f"{CHECKOUT_URL}?plan=monthly")
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# POST /payments/upgrade-to-lifetime
# ---------------------------------------------------------------------------


def test_upgrade_already_lifetime_rejected(client, lifetime_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    response = client.post(UPGRADE_URL, headers=lifetime_headers)
    assert response.status_code == 400
    assert "lifetime" in response.json()["detail"]


def test_upgrade_no_active_subscription_rejected(client, free_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    response = client.post(UPGRADE_URL, headers=free_headers)
    assert response.status_code == 400
    assert "No active subscription" in response.json()["detail"]


def test_upgrade_lifetime_price_not_configured(client, active_headers, mocker):
    mocker.patch.dict(
        "app.routes.payments.PRICE_IDS",
        {"monthly": "price_m", "yearly": "price_y", "lifetime": None},
    )
    response = client.post(UPGRADE_URL, headers=active_headers)
    assert response.status_code == 500
    assert "not configured" in response.json()["detail"]


def test_upgrade_cancels_existing_subscription(client, active_user, active_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mock_sub_modify = mocker.patch("stripe.Subscription.modify")
    mocker.patch(
        "stripe.checkout.Session.create",
        return_value=MagicMock(url="https://checkout.stripe.com/upgrade"),
    )

    response = client.post(UPGRADE_URL, headers=active_headers)

    assert response.status_code == 200
    mock_sub_modify.assert_called_once_with(
        active_user.stripe_subscription_id, cancel_at_period_end=True
    )


def test_upgrade_no_subscription_id_skips_cancel(client, db, active_user, active_headers, mocker):
    active_user.stripe_subscription_id = None
    db.commit()

    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mock_sub_modify = mocker.patch("stripe.Subscription.modify")
    mocker.patch(
        "stripe.checkout.Session.create",
        return_value=MagicMock(url="https://checkout.stripe.com/upgrade"),
    )

    response = client.post(UPGRADE_URL, headers=active_headers)

    assert response.status_code == 200
    mock_sub_modify.assert_not_called()


def test_upgrade_returns_checkout_url(client, active_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mocker.patch("stripe.Subscription.modify")
    mocker.patch(
        "stripe.checkout.Session.create",
        return_value=MagicMock(url="https://checkout.stripe.com/upgrade_url"),
    )

    response = client.post(UPGRADE_URL, headers=active_headers)

    assert response.status_code == 200
    assert response.json()["url"] == "https://checkout.stripe.com/upgrade_url"


def test_upgrade_requires_auth(client):
    response = client.post(UPGRADE_URL)
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# POST /payments/webhook
# ---------------------------------------------------------------------------


def _webhook(client, event, mocker):
    """Helper: mock construct_event and POST to /payments/webhook."""
    mocker.patch("stripe.Webhook.construct_event", return_value=event)
    payload = json.dumps(event).encode()
    return client.post(
        WEBHOOK_URL,
        content=payload,
        headers={"stripe-signature": "t=123,v1=abc"},
    )


def test_webhook_invalid_signature(client, mocker):
    mocker.patch(
        "stripe.Webhook.construct_event",
        side_effect=SignatureVerificationError("bad sig", "t=bad"),
    )
    response = client.post(
        WEBHOOK_URL,
        content=b"{}",
        headers={"stripe-signature": "t=bad,v1=bad"},
    )
    assert response.status_code == 400
    assert "Invalid signature" in response.json()["detail"]


def test_webhook_checkout_completed_sets_lifetime(client, db, free_user, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": str(free_user.id),
                "mode": "payment",
                "subscription": None,
            }
        },
    }
    response = _webhook(client, event, mocker)

    assert response.status_code == 200
    db.refresh(free_user)
    assert free_user.subscription_status == "lifetime"
    assert free_user.subscription_tier == "lifetime"


def test_webhook_checkout_completed_sets_yearly(client, db, free_user, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mocker.patch(
        "stripe.Subscription.retrieve",
        return_value={"items": {"data": [{"price": {"id": "price_yearly_123"}}]}},
    )
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": str(free_user.id),
                "mode": "subscription",
                "subscription": "sub_yearly_abc",
            }
        },
    }
    response = _webhook(client, event, mocker)

    assert response.status_code == 200
    db.refresh(free_user)
    assert free_user.subscription_status == "active"
    assert free_user.subscription_tier == "yearly"
    assert free_user.stripe_subscription_id == "sub_yearly_abc"


def test_webhook_checkout_completed_sets_monthly(client, db, free_user, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mocker.patch(
        "stripe.Subscription.retrieve",
        return_value={"items": {"data": [{"price": {"id": "price_monthly_123"}}]}},
    )
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": str(free_user.id),
                "mode": "subscription",
                "subscription": "sub_monthly_abc",
            }
        },
    }
    response = _webhook(client, event, mocker)

    assert response.status_code == 200
    db.refresh(free_user)
    assert free_user.subscription_status == "active"
    assert free_user.subscription_tier == "monthly"


def test_webhook_checkout_unknown_user_returns_ok(client, mocker):
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": "99999",
                "mode": "payment",
                "subscription": None,
            }
        },
    }
    response = _webhook(client, event, mocker)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_webhook_subscription_deleted_clears_status(client, db, active_user, mocker):
    event = {
        "type": "customer.subscription.deleted",
        "data": {"object": {"id": active_user.stripe_subscription_id}},
    }
    response = _webhook(client, event, mocker)

    assert response.status_code == 200
    db.refresh(active_user)
    assert active_user.subscription_status == "inactive"
    assert active_user.subscription_tier is None
    assert active_user.stripe_subscription_id is None


def test_webhook_unknown_event_type_is_noop(client, db, free_user, mocker):
    event = {"type": "some.unknown.event", "data": {"object": {}}}
    response = _webhook(client, event, mocker)

    assert response.status_code == 200
    db.refresh(free_user)
    assert free_user.subscription_status == "inactive"


# ---------------------------------------------------------------------------
# POST /payments/verify-session
# ---------------------------------------------------------------------------


def test_verify_session_invalid_session_id(client, free_headers, mocker):
    mocker.patch(
        "stripe.checkout.Session.retrieve",
        side_effect=InvalidRequestError("No such session", "session_id"),
    )
    response = client.post(f"{VERIFY_URL}?session_id=cs_bad", headers=free_headers)
    assert response.status_code == 400
    assert "Invalid session" in response.json()["detail"]


def test_verify_session_wrong_user_rejected(client, free_user, free_headers, mocker):
    mocker.patch(
        "stripe.checkout.Session.retrieve",
        return_value={
            "client_reference_id": "99999",
            "payment_status": "paid",
            "mode": "payment",
            "subscription": None,
        },
    )
    response = client.post(f"{VERIFY_URL}?session_id=cs_test_123", headers=free_headers)
    assert response.status_code == 403
    assert "does not belong" in response.json()["detail"]


def test_verify_session_payment_not_completed_rejected(client, free_user, free_headers, mocker):
    mocker.patch(
        "stripe.checkout.Session.retrieve",
        return_value={
            "client_reference_id": str(free_user.id),
            "payment_status": "unpaid",
            "mode": "payment",
            "subscription": None,
        },
    )
    response = client.post(f"{VERIFY_URL}?session_id=cs_test_123", headers=free_headers)
    assert response.status_code == 400
    assert "Payment not completed" in response.json()["detail"]


def test_verify_session_lifetime_payment(client, db, free_user, free_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mocker.patch(
        "stripe.checkout.Session.retrieve",
        return_value={
            "client_reference_id": str(free_user.id),
            "payment_status": "paid",
            "mode": "payment",
            "subscription": None,
        },
    )
    response = client.post(f"{VERIFY_URL}?session_id=cs_test_lifetime", headers=free_headers)

    assert response.status_code == 200
    db.refresh(free_user)
    assert free_user.subscription_status == "lifetime"
    assert free_user.subscription_tier == "lifetime"


def test_verify_session_yearly_subscription(client, db, free_user, free_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mocker.patch(
        "stripe.checkout.Session.retrieve",
        return_value={
            "client_reference_id": str(free_user.id),
            "payment_status": "paid",
            "mode": "subscription",
            "subscription": "sub_yearly_abc",
        },
    )
    mocker.patch(
        "stripe.Subscription.retrieve",
        return_value={"items": {"data": [{"price": {"id": "price_yearly_123"}}]}},
    )

    response = client.post(f"{VERIFY_URL}?session_id=cs_test_yearly", headers=free_headers)

    assert response.status_code == 200
    db.refresh(free_user)
    assert free_user.subscription_status == "active"
    assert free_user.subscription_tier == "yearly"


def test_verify_session_monthly_subscription(client, db, free_user, free_headers, mocker):
    mocker.patch.dict("app.routes.payments.PRICE_IDS", MOCK_PRICE_IDS)
    mocker.patch(
        "stripe.checkout.Session.retrieve",
        return_value={
            "client_reference_id": str(free_user.id),
            "payment_status": "paid",
            "mode": "subscription",
            "subscription": "sub_monthly_abc",
        },
    )
    mocker.patch(
        "stripe.Subscription.retrieve",
        return_value={"items": {"data": [{"price": {"id": "price_monthly_123"}}]}},
    )

    response = client.post(f"{VERIFY_URL}?session_id=cs_test_monthly", headers=free_headers)

    assert response.status_code == 200
    db.refresh(free_user)
    assert free_user.subscription_status == "active"
    assert free_user.subscription_tier == "monthly"


def test_verify_session_requires_auth(client):
    response = client.post(f"{VERIFY_URL}?session_id=cs_test_123")
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# POST /payments/portal
# ---------------------------------------------------------------------------


def test_portal_no_customer_id_rejected(client, free_headers):
    response = client.post(PORTAL_URL, headers=free_headers)
    assert response.status_code == 400
    assert "No billing account" in response.json()["detail"]


def test_portal_returns_url(client, active_headers, mocker):
    mocker.patch(
        "stripe.billing_portal.Session.create",
        return_value=MagicMock(url="https://billing.stripe.com/session/bps_123"),
    )

    response = client.post(PORTAL_URL, headers=active_headers)

    assert response.status_code == 200
    assert response.json()["url"] == "https://billing.stripe.com/session/bps_123"


def test_portal_requires_auth(client):
    response = client.post(PORTAL_URL)
    assert response.status_code == 403
