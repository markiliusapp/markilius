from fastapi import APIRouter, status, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
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

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


router = APIRouter(prefix="/auth", tags=["Authentication"])


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
    print("Printing google id token: ", google_id_token)
    # Verify Google ID token
    idinfo = id_token.verify_oauth2_token(
        google_id_token["credential"],
        google_requests.Request(),
        GOOGLE_CLIENT_ID,
    )

    print("Printing id infomration (idinfo): ", idinfo)
    print("Printing google id token: ", google_id_token)

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
        print(
            "Printing secrets.token_urlsafe(32): ", secrets.token_urlsafe(32)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer"}
