from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.models.arena import Arena
from app.models.user import User
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
import secrets
from datetime import datetime, timedelta, timezone
from app.services.email import send_password_reset_email


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


router = APIRouter(prefix="/auth", tags=["Authentication"])

DEFAULT_ARENAS = [
    {"name": "Miscellaneous", "color": "#a8a29e"},
    {"name": "Fitness", "color": "#f97316"},
    {"name": "Learning", "color": "#3b82f6"},
    {"name": "Work", "color": "#8b5cf6"},
    {"name": "Creativity", "color": "#ec4899"},
    {"name": "Mindfulness", "color": "#10b981"},
]


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(user_input: UserCreate, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User).filter(User.email == user_input.email).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. ",
        )

    new_user = User(
        first_name=user_input.first_name,
        last_name=user_input.last_name,
        email=user_input.email,
        hashed_password=hash_password(user_input.password),
    )
    db.add(new_user)
    db.commit()

    for arena_data in DEFAULT_ARENAS:
        db.add(
            Arena(
                user_id=new_user.id,
                name=arena_data["name"],
                color=arena_data["color"],
            )
        )
    db.commit()

    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
def login(user_input: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_input.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not (verify_password(user_input.password, user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/google", response_model=Token)
def google_login(google_id_token: dict, db: Session = Depends(get_db)):
    """
    Verify Google ID token and login/register user
    """
    # Verify Google ID token
    idinfo = id_token.verify_oauth2_token(
        google_id_token["credential"],
        google_requests.Request(),
        GOOGLE_CLIENT_ID,
    )

    # Get user info from token
    email = idinfo["email"]
    first_name = idinfo.get("given_name", "")
    last_name = idinfo.get("family_name", "")

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create new user (no password for OAuth users)
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            hashed_password=hash_password(
                secrets.token_urlsafe(32)
            ),  # Random password
        )

        db.add(user)
        db.commit()

        for arena_data in DEFAULT_ARENAS:
            db.add(
                Arena(
                    user_id=user.id,
                    name=arena_data["name"],
                    color=arena_data["color"],
                )
            )
        db.commit()

        db.refresh(user)

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    """
    Send password reset email
    """
    user = db.query(User).filter(User.email == request.email).first()

    # Don't reveal if email exists (security best practice)
    if not user:
        return {"message": "If that email exists, a reset link has been sent"}

    # Generate reset token (32 random bytes)
    reset_token = secrets.token_urlsafe(32)

    # Token expires in 5 minutes
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(
        minutes=5
    )

    db.commit()
    try:
        await send_password_reset_email(user.email, reset_token)
    except Exception as e:
        print(f"Failed to send email: {e}")

    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest, db: Session = Depends(get_db)
):
    """
    Reset password using token
    """
    user = db.query(User).filter(User.reset_token == request.token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    now = datetime.now(timezone.utc)
    # Check if token has expired
    if user.reset_token_expires < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired",
        )

    # Update password
    user.hashed_password = hash_password(request.new_password)
    user.reset_token = None  # Clear token
    user.reset_token_expires = None

    db.commit()

    return {"message": "Password successfully reset"}
