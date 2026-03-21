import os
import stripe
from stripe import InvalidRequestError, SignatureVerificationError
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

PRICE_IDS = {
    "monthly": os.getenv("STRIPE_PRICE_MONTHLY"),
    "yearly": os.getenv("STRIPE_PRICE_YEARLY"),
    "lifetime": os.getenv("STRIPE_PRICE_LIFETIME"),
}

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
        success_url=f"{FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/pricing",
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

    # Cancel existing subscription at period end so they keep access until expiry
    if current_user.stripe_subscription_id:
        stripe.Subscription.modify(
            current_user.stripe_subscription_id,
            cancel_at_period_end=True,
        )

    session = stripe.checkout.Session.create(
        customer=current_user.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="payment",
        client_reference_id=str(current_user.id),
        success_url=f"{FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/dashboard/profile",
    )

    return {"url": session.url}


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
        if mode == "payment":
            user.subscription_status = "lifetime"
            user.subscription_tier = "lifetime"
        else:
            user.subscription_status = "active"
            subscription_id = session.get("subscription")
            user.stripe_subscription_id = subscription_id
            # Determine monthly vs yearly from the subscription
            if subscription_id:
                sub = stripe.Subscription.retrieve(subscription_id)
                price_id = sub["items"]["data"][0]["price"]["id"]
                if price_id == PRICE_IDS["yearly"]:
                    user.subscription_tier = "yearly"
                else:
                    user.subscription_tier = "monthly"

        db.commit()

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        user = db.query(User).filter(
            User.stripe_subscription_id == subscription["id"]
        ).first()
        if user:
            user.subscription_status = "inactive"
            user.subscription_tier = None
            user.stripe_subscription_id = None
            db.commit()

    return {"status": "ok"}


@router.post("/verify-session")
def verify_session(
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
    return {"status": "ok"}


@router.post("/portal")
def create_portal_session(
    current_user: User = Depends(get_current_user),
):
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=f"{FRONTEND_URL}/dashboard/profile",
    )

    return {"url": session.url}
