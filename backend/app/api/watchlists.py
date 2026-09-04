from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.watchlist import Watchlist
from app.models.user import User
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate, WatchlistOut
from app.api.auth import get_or_create_demo_user

router = APIRouter(prefix="/watchlists", tags=["watchlists"])


def get_current_user(x_user_id: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    """Simple header-based auth. Falls back to demo user."""
    if x_user_id:
        user = db.query(User).filter(User.id == int(x_user_id)).first()
        if user:
            return user
    return get_or_create_demo_user(db)


@router.get("", response_model=List[WatchlistOut])
def list_watchlists(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    watchlists = db.query(Watchlist).filter(Watchlist.user_id == user.id).all()
    result = []
    for wl in watchlists:
        out = WatchlistOut.model_validate(wl)
        out.stock_count = len(wl.stocks)
        result.append(out)
    return result


@router.post("", response_model=WatchlistOut, status_code=status.HTTP_201_CREATED)
def create_watchlist(
    payload: WatchlistCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = Watchlist(name=payload.name, user_id=user.id)
    db.add(wl)
    db.commit()
    db.refresh(wl)
    out = WatchlistOut.model_validate(wl)
    out.stock_count = 0
    return out


@router.put("/{watchlist_id}", response_model=WatchlistOut)
def update_watchlist(
    watchlist_id: int,
    payload: WatchlistUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.user_id == user.id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    wl.name = payload.name
    db.commit()
    db.refresh(wl)
    out = WatchlistOut.model_validate(wl)
    out.stock_count = len(wl.stocks)
    return out


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_watchlist(
    watchlist_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.user_id == user.id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    db.delete(wl)
    db.commit()
