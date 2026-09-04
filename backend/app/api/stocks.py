from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.db.database import get_db
from app.models.watchlist import Watchlist
from app.models.watchlist_stock import WatchlistStock
from app.models.market_snapshot import MarketSnapshot
from app.models.user import User
from app.schemas.stock import StockAdd, StockOut, MarketSnapshotOut
from app.schemas.market import StockDetailOut, StockQuote
from app.schemas.change import AttentionScore
from app.services import market_data_service
from app.services.attention_service import calculate_attention_score
from app.services.change_detection_service import get_recent_snapshots
from app.services.data_validation_service import get_data_status, should_update_snapshot
from app.api.auth import get_or_create_demo_user
from datetime import datetime, timezone

router = APIRouter(tags=["stocks"])


def get_current_user(x_user_id: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if x_user_id:
        user = db.query(User).filter(User.id == int(x_user_id)).first()
        if user:
            return user
    return get_or_create_demo_user(db)


def _get_watchlist_or_404(watchlist_id: int, user_id: int, db: Session) -> Watchlist:
    wl = db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.user_id == user_id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    return wl


@router.get("/watchlists/{watchlist_id}/stocks", response_model=List[StockOut])
def list_stocks(
    watchlist_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_watchlist_or_404(watchlist_id, user.id, db)
    return db.query(WatchlistStock).filter(WatchlistStock.watchlist_id == watchlist_id).all()


@router.post("/watchlists/{watchlist_id}/stocks", response_model=StockOut, status_code=status.HTTP_201_CREATED)
async def add_stock(
    watchlist_id: int,
    payload: StockAdd,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_watchlist_or_404(watchlist_id, user.id, db)
    symbol = payload.symbol.upper().strip()

    # Fetch market data to validate symbol and get company name
    market_data = await market_data_service.fetch_stock_data(symbol)
    company_name = payload.company_name or market_data.company_name or symbol

    if market_data.price is None and market_data.error:
        if "Invalid symbol" in (market_data.error or ""):
            raise HTTPException(status_code=400, detail=f"Invalid stock symbol: {symbol}")

    stock = WatchlistStock(
        watchlist_id=watchlist_id,
        symbol=symbol,
        company_name=company_name,
    )
    try:
        db.add(stock)
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"{symbol} is already in this watchlist")

    # Persist initial snapshot
    if market_data.price is not None:
        snapshot = MarketSnapshot(
            symbol=symbol,
            price=market_data.price,
            volume=market_data.volume,
            market_cap=market_data.market_cap,
            day_high=market_data.day_high,
            day_low=market_data.day_low,
            week52_high=market_data.week52_high,
            week52_low=market_data.week52_low,
            change_percent=market_data.change_percent,
            avg_volume=market_data.avg_volume,
            timestamp=market_data.timestamp,
            data_source=market_data.data_source,
            data_status=market_data.data_status,
        )
        db.add(snapshot)

    db.commit()
    db.refresh(stock)
    return stock


@router.delete("/watchlists/{watchlist_id}/stocks/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
def remove_stock(
    watchlist_id: int,
    symbol: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_watchlist_or_404(watchlist_id, user.id, db)
    stock = (
        db.query(WatchlistStock)
        .filter(WatchlistStock.watchlist_id == watchlist_id, WatchlistStock.symbol == symbol.upper())
        .first()
    )
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found in watchlist")
    db.delete(stock)
    db.commit()


@router.get("/stocks/search")
async def search_stocks(q: str):
    if not q or len(q) < 1:
        return []
    results = await market_data_service.search_symbol(q)
    return results


@router.get("/stocks/{symbol}", response_model=StockDetailOut)
async def get_stock_detail(
    symbol: str,
    db: Session = Depends(get_db),
):
    symbol = symbol.upper().strip()

    # Fetch fresh data
    market_data = await market_data_service.fetch_stock_data(symbol)

    # Get latest stored snapshot
    latest_snapshot = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.symbol == symbol)
        .order_by(MarketSnapshot.timestamp.desc())
        .first()
    )

    # Decide whether to persist new snapshot
    if market_data.price is not None and should_update_snapshot(latest_snapshot, market_data.price):
        snapshot = MarketSnapshot(
            symbol=symbol,
            price=market_data.price,
            volume=market_data.volume,
            market_cap=market_data.market_cap,
            day_high=market_data.day_high,
            day_low=market_data.day_low,
            week52_high=market_data.week52_high,
            week52_low=market_data.week52_low,
            change_percent=market_data.change_percent,
            avg_volume=market_data.avg_volume,
            timestamp=market_data.timestamp,
            data_source=market_data.data_source,
            data_status=market_data.data_status,
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        latest_snapshot = snapshot

    # Build quote — use live data if available, else fall back to stored
    if market_data.price is not None:
        quote = StockQuote(
            symbol=symbol,
            company_name=market_data.company_name,
            price=market_data.price,
            volume=market_data.volume,
            market_cap=market_data.market_cap,
            day_high=market_data.day_high,
            day_low=market_data.day_low,
            week52_high=market_data.week52_high,
            week52_low=market_data.week52_low,
            change_percent=market_data.change_percent,
            avg_volume=market_data.avg_volume,
            timestamp=market_data.timestamp,
            data_source=market_data.data_source,
            data_status=market_data.data_status,
        )
    elif latest_snapshot:
        ts = latest_snapshot.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        quote = StockQuote(
            symbol=symbol,
            company_name=None,
            price=latest_snapshot.price,
            volume=latest_snapshot.volume,
            market_cap=latest_snapshot.market_cap,
            day_high=latest_snapshot.day_high,
            day_low=latest_snapshot.day_low,
            week52_high=latest_snapshot.week52_high,
            week52_low=latest_snapshot.week52_low,
            change_percent=latest_snapshot.change_percent,
            avg_volume=latest_snapshot.avg_volume,
            timestamp=ts,
            data_source=latest_snapshot.data_source or "cached",
            data_status="STALE",
        )
    else:
        raise HTTPException(status_code=404, detail=f"No data available for {symbol}")

    # Historical snapshots for charts
    recent = get_recent_snapshots(db, symbol, limit=30)
    price_history = [
        {"time": s.timestamp.isoformat(), "price": s.price}
        for s in recent if s.price
    ]
    volume_history = [
        {"time": s.timestamp.isoformat(), "volume": s.volume}
        for s in recent if s.volume
    ]
    snapshots_out = [
        {
            "id": s.id,
            "timestamp": s.timestamp.isoformat(),
            "price": s.price,
            "volume": s.volume,
            "data_status": s.data_status,
        }
        for s in recent
    ]

    # Attention score using latest data
    attention = calculate_attention_score(
        price_change_pct=quote.change_percent,
        volume_change_pct=None,
        price=quote.price,
        day_high=quote.day_high,
        day_low=quote.day_low,
        week52_high=quote.week52_high,
        week52_low=quote.week52_low,
        recent_snapshots=recent,
    )

    return StockDetailOut(
        quote=quote,
        attention_score=attention,
        price_history=price_history,
        volume_history=volume_history,
        snapshots=snapshots_out,
    )


@router.get("/stocks/{symbol}/history", response_model=List[MarketSnapshotOut])
def get_stock_history(symbol: str, limit: int = 30, db: Session = Depends(get_db)):
    snapshots = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.symbol == symbol.upper())
        .order_by(MarketSnapshot.timestamp.desc())
        .limit(limit)
        .all()
    )
    return snapshots
