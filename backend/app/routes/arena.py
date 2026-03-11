from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.arena import Arena
from app.models.user import User
from app.schemas.arena import ArenaResponse, ArenaCreate, ArenaUpdate
from app.database import get_db
from .auth import get_current_user
from sqlalchemy.exc import SQLAlchemyError, OperationalError

router = APIRouter(prefix="/arenas", tags=["arenas"])

ARENA_LIMIT = 10


@router.get("/", response_model=list[ArenaResponse])
def get_arenas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetches all the arenas
    """
    try:
        arenas = (
            db.query(Arena)
            .filter(Arena.user_id == current_user.id)
            .order_by(Arena.created_at)
            .all()
        )
    except OperationalError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed",
        )
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred",
        )

    return arenas


@router.post(
    "/", response_model=ArenaResponse, status_code=status.HTTP_201_CREATED
)
def create_arena(
    arena: ArenaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(Arena).filter(Arena.user_id == current_user.id).count()
    if count >= ARENA_LIMIT:
        raise HTTPException(
            status_code=400, detail=f"Arena limit of {ARENA_LIMIT} reached"
        )

    new_arena = Arena(
        user_id=current_user.id, name=arena.name, color=arena.color
    )
    db.add(new_arena)
    db.commit()
    db.refresh(new_arena)
    return new_arena


@router.put("/{arena_id}", response_model=ArenaResponse)
def update_arena(
    arena_id: int,
    arena: ArenaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_arena = (
        db.query(Arena)
        .filter(
            Arena.id == arena_id,
            Arena.user_id == current_user.id,
        )
        .first()
    )
    if not db_arena:
        raise HTTPException(status_code=404, detail="Arena not found")

    if arena.name is not None:
        db_arena.name = arena.name
    if arena.color is not None:
        db_arena.color = arena.color

    db.commit()
    db.refresh(db_arena)
    return db_arena


@router.delete("/{arena_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_arena(
    arena_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_arena = (
        db.query(Arena)
        .filter(
            Arena.id == arena_id,
            Arena.user_id == current_user.id,
        )
        .first()
    )
    if not db_arena:
        raise HTTPException(status_code=404, detail="Arena not found")

    db.delete(db_arena)
    db.commit()
    return {"message": "Arena deleted"}
