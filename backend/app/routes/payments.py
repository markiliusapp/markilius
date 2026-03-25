import os
import stripe
from stripe import InvalidRequestError, SignatureVerificationError
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user
from app.services.email import send_payment_failed_email, send_subscription_welcome_email, send_plan_switched_email
from datetime import datetime, timezone

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

PRICE_IDS = {
    "monthly": os.getenv("STRIPE_PRICE_MONTHLY"),
    "yearly": os.getenv("STRIPE_PRICE_YEARLY"),
    "lifetime": os.getenv("STRIPE_PRICE_LIFETIME"),
}


def get_frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173")

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/checkout")
def create_checkout_session(
    plan: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if plan not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    price_id = PRICE_IDS[plan]
    if not price_id:
        raise HTTPException(status_code=500, detail="Plan not configured")

    # Block already-subscribed users
    if current_user.subscription_status == "lifetime":
        raise HTTPException(status_code=400, detail="You already have a lifetime plan")
    if current_user.subscription_status == "active":
        raise HTTPException(status_code=400, detail="You already have an active subscription. Use the billing portal to manage it.")

    # Create or reuse Stripe customer
    if current_user.stripe_customer_id:
        customer_id = current_user.stripe_customer_id
    else:
        customer = stripe.Customer.create(
            email=current_user.email,
            metadata={"user_id": str(current_user.id)},
        )
        customer_id = customer.id
        current_user.stripe_customer_id = customer_id
        db.commit()

    mode = "payment" if plan == "lifetime" else "subscription"

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode=mode,
        client_reference_id=str(current_user.id),
        success_url=f"{get_frontend_url()}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{get_frontend_url()}/pricing",
    )

    return {"url": session.url}


@router.post("/upgrade-to-lifetime")
def upgrade_to_lifetime(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.subscription_status == "lifetime":
        raise HTTPException(status_code=400, detail="You already have a lifetime plan")
    if current_user.subscription_status != "active":
        raise HTTPException(status_code=400, detail="No active subscription to upgrade from")

    price_id = PRICE_IDS["lifetime"]
    if not price_id:
        raise HTTPException(status_code=500, detail="Lifetime plan not configured")

    session = stripe.checkout.Session.create(
        customer=current_user.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="payment",
        client_reference_id=str(current_user.id),
        success_url=f"{get_frontend_url()}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&upgrade=1",
        cancel_url=f"{get_frontend_url()}/dashboard/profile",
    )

    return {"url": session.url}


@router.post("/upgrade-subscription")
async def upgrade_subscription(
    plan: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.subscription_status != "active":
        raise HTTPException(status_code=400, detail="No active subscription to upgrade")
    if plan not in PRICE_IDS or plan == "lifetime":
        raise HTTPException(status_code=400, detail="Invalid upgrade target")

    tier_order = {"monthly": 1, "yearly": 2}
    if tier_order.get(plan, 0) <= tier_order.get(current_user.subscription_tier, 0):
        raise HTTPException(status_code=400, detail="Downgrades are not supported")

    price_id = PRICE_IDS.get(plan)
    if not price_id:
        raise HTTPException(status_code=500, detail="Plan not configured")

    if not current_user.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No subscription found")

    sub = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
    item_id = sub["items"]["data"][0]["id"]

    stripe.Subscription.modify(
        current_user.stripe_subscription_id,
        items=[{"id": item_id, "price": price_id}],
        proration_behavior="always_invoice",
    )

    old_tier = current_user.subscription_tier
    current_user.subscription_tier = plan
    db.commit()
    db.refresh(current_user)

    await send_plan_switched_email(current_user.email, current_user.first_name, old_tier or "monthly", plan)

    return {"status": "ok", "tier": plan}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session.get("client_reference_id"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"status": "ok"}

        mode = session.get("mode")
        was_active = user.subscription_status in ("active", "past_due")
        old_tier = user.subscription_tier

        if mode == "payment":
            # Cancel the existing subscription at period end now that lifetime payment is confirmed
            if was_active and user.stripe_subscription_id:
                stripe.Subscription.modify(
                    user.stripe_subscription_id,
                    cancel_at_period_end=True,
                )
            user.subscription_status = "lifetime"
            user.subscription_tier = "lifetime"
        else:
            user.subscription_status = "active"
            subscription_id = session.get("subscription")
            user.stripe_subscription_id = subscription_id
            if subscription_id:
                sub = stripe.Subscription.retrieve(subscription_id)
                price_id = sub["items"]["data"][0]["price"]["id"]
                if price_id == PRICE_IDS["yearly"]:
                    user.subscription_tier = "yearly"
                else:
                    user.subscription_tier = "monthly"

        db.commit()

        if was_active and mode == "payment":
            # Upgrade from existing subscription to lifetime
            await send_plan_switched_email(user.email, user.first_name, old_tier or "monthly", "lifetime")
        else:
            # Fresh purchase
            await send_subscription_welcome_email(user.email, user.first_name, user.subscription_tier)

    elif event["type"] == "invoice.paid":
        # Payment succeeded (covers both initial and retry after past_due)
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user and user.subscription_status == "past_due":
            user.subscription_status = "active"
            db.commit()

    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user and user.subscription_status not in ("inactive", "lifetime"):
            user.subscription_status = "past_due"
            db.commit()
            next_attempt_ts = invoice.get("next_payment_attempt")
            next_retry = (
                datetime.fromtimestamp(next_attempt_ts, tz=timezone.utc).strftime("%B %d, %Y")
                if next_attempt_ts else None
            )
            await send_payment_failed_email(user.email, user.first_name, next_retry)

    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        user = db.query(User).filter(
            User.stripe_subscription_id == subscription["id"]
        ).first()
        if user and user.subscription_status != "lifetime":
            price_id = subscription["items"]["data"][0]["price"]["id"]
            if price_id == PRICE_IDS["yearly"]:
                user.subscription_tier = "yearly"
            elif price_id == PRICE_IDS["monthly"]:
                user.subscription_tier = "monthly"
            db.commit()

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        user = db.query(User).filter(
            User.stripe_subscription_id == subscription["id"]
        ).first()
        if user:
            # past_due means all retries failed — keep data accessible in read-only
            user.subscription_status = "read_only" if user.subscription_status == "past_due" else "inactive"
            user.subscription_tier = None
            user.stripe_subscription_id = None
            db.commit()

    elif event["type"] == "checkout.session.expired":
        # If a lifetime upgrade checkout expires, the subscription was NOT yet marked for
        # cancellation (we defer that to checkout.session.completed), so no reversal needed.
        # This handler is a safety net: if for any reason cancel_at_period_end was set
        # before payment, reverse it so the user's subscription is restored cleanly.
        session = event["data"]["object"]
        client_ref = session.get("client_reference_id")
        if client_ref and session.get("mode") == "payment":
            user = db.query(User).filter(User.id == int(client_ref)).first()
            if user and user.stripe_subscription_id and user.subscription_status in ("active", "past_due"):
                sub = stripe.Subscription.retrieve(user.stripe_subscription_id)
                if sub.get("cancel_at_period_end"):
                    stripe.Subscription.modify(
                        user.stripe_subscription_id,
                        cancel_at_period_end=False,
                    )

    return {"status": "ok"}


@router.post("/verify-session")
async def verify_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except InvalidRequestError:
        raise HTTPException(status_code=400, detail="Invalid session")

    if session.get("client_reference_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Session does not belong to this user")

    if session.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Payment not completed")

    was_inactive = current_user.subscription_status in ("inactive", None)
    was_active = current_user.subscription_status in ("active", "past_due")
    old_tier = current_user.subscription_tier

    mode = session.get("mode")
    if mode == "payment":
        current_user.subscription_status = "lifetime"
        current_user.subscription_tier = "lifetime"
    else:
        current_user.subscription_status = "active"
        subscription_id = session.get("subscription")
        current_user.stripe_subscription_id = subscription_id
        if subscription_id:
            sub = stripe.Subscription.retrieve(subscription_id)
            price_id = sub["items"]["data"][0]["price"]["id"]
            current_user.subscription_tier = "yearly" if price_id == PRICE_IDS["yearly"] else "monthly"

    db.commit()
    db.refresh(current_user)

    if was_active and mode == "payment":
        await send_plan_switched_email(current_user.email, current_user.first_name, old_tier or "monthly", "lifetime")
    elif was_inactive:
        await send_subscription_welcome_email(current_user.email, current_user.first_name, current_user.subscription_tier)

    return {"status": "ok"}


@router.post("/portal")
def create_portal_session(
    current_user: User = Depends(get_current_user),
):
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=f"{get_frontend_url()}/dashboard/profile",
    )

    return {"url": session.url}
