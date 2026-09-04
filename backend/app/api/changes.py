from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.watchlist import Watchlist
from app.models.user import User
from app.schemas.change import WatchlistChangeSummary, ChangeDetail
from app.services.change_detection_service import get_watchlist_changes, get_latest_two_snapshots, build_change_detail
from app.api.auth import get_or_create_demo_user
from app.services import market_data_service
from app.models.market_snapshot import MarketSnapshot
from app.services.data_validation_service import should_update_snapshot

router = APIRouter(tags=["changes"])


def get_current_user(x_user_id: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if x_user_id:
        user = db.query(User).filter(User.id == int(x_user_id)).first()
        if user:
            return user
    return get_or_create_demo_user(db)


@router.get("/watchlists/{watchlist_id}/changes", response_model=WatchlistChangeSummary)
async def get_changes(
    watchlist_id: int,
    refresh: bool = True,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wl = db.query(Watchlist).filter(Watchlist.id == watchlist_id, Watchlist.user_id == user.id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    if refresh and wl.stocks:
        # Fetch fresh data for all stocks and persist new snapshots
        for stock in wl.stocks:
            market_data = await market_data_service.fetch_stock_data(stock.symbol)
            if market_data.price is not None:
                latest = (
                    db.query(MarketSnapshot)
                    .filter(MarketSnapshot.symbol == stock.symbol)
                    .order_by(MarketSnapshot.timestamp.desc())
                    .first()
                )
                if should_update_snapshot(latest, market_data.price):
                    snapshot = MarketSnapshot(
                        symbol=stock.symbol,
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
                    # Update company name if we got it
                    if market_data.company_name and not stock.company_name:
                        stock.company_name = market_data.company_name
        db.commit()

    return get_watchlist_changes(db, watchlist_id, wl.name, wl.stocks)


@router.get("/stocks/{symbol}/changes", response_model=ChangeDetail)
def get_stock_changes(symbol: str, db: Session = Depends(get_db)):
    symbol = symbol.upper()
    current, previous = get_latest_two_snapshots(db, symbol)
    if not current:
        raise HTTPException(status_code=404, detail=f"No snapshot data for {symbol}")
    return build_change_detail(db, symbol, None, current, previous)
