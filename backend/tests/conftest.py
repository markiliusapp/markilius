import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.arena import Arena
from app.models.task import Task
from app.utils.auth import hash_password, create_access_token

# Use in-memory SQLite for fast, isolated tests.
# Note: SQLite does not support timezone-aware timestamps. Tests that
# involve TIMESTAMP(timezone=True) comparisons (e.g. reset_token_expires)
# must mock datetime.now to return a naive datetime to avoid TypeError.
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def test_user(db):
    user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        hashed_password=hash_password("password123"),
        is_verified=True,
        subscription_status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def auth_headers(test_user):
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def test_arena(db, test_user):
    arena = Arena(user_id=test_user.id, name="Test Arena", color="#3b82f6")
    db.add(arena)
    db.commit()
    db.refresh(arena)
    return arena
