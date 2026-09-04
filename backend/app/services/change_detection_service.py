"""
Change Detection Service
Compares current market snapshot against the previous one to detect meaningful changes.
"""
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.market_snapshot import MarketSnapshot
from app.models.watchlist_stock import WatchlistStock
from app.schemas.change import ChangeDetail, WatchlistChangeSummary
from app.services.attention_service import calculate_attention_score
from app.services.data_validation_service import get_data_status


def _pct_change(current: Optional[float], previous: Optional[float]) -> Optional[float]:
    if current is None or previous is None or previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 2)


def get_latest_two_snapshots(db: Session, symbol: str) -> tuple[Optional[MarketSnapshot], Optional[MarketSnapshot]]:
    """Returns (current, previous) snapshots for a symbol."""
    snapshots = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.symbol == symbol)
        .order_by(MarketSnapshot.timestamp.desc())
        .limit(2)
        .all()
    )
    if len(snapshots) == 0:
        return None, None
    if len(snapshots) == 1:
        return snapshots[0], None
    return snapshots[0], snapshots[1]


def get_recent_snapshots(db: Session, symbol: str, limit: int = 10) -> List[MarketSnapshot]:
    return (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.symbol == symbol)
        .order_by(MarketSnapshot.timestamp.asc())
        .limit(limit)
        .all()
    )


def build_change_detail(
    db: Session,
    symbol: str,
    company_name: Optional[str],
    current: Optional[MarketSnapshot],
    previous: Optional[MarketSnapshot],
) -> ChangeDetail:
    price_change_pct = _pct_change(
        current.price if current else None,
        previous.price if previous else None,
    )
    volume_change_pct = _pct_change(
        current.volume if current else None,
        previous.volume if previous else None,
    )

    recent = get_recent_snapshots(db, symbol, limit=10)

    attention = calculate_attention_score(
        price_change_pct=price_change_pct,
        volume_change_pct=volume_change_pct,
        price=current.price if current else None,
        day_high=current.day_high if current else None,
        day_low=current.day_low if current else None,
        week52_high=current.week52_high if current else None,
        week52_low=current.week52_low if current else None,
        recent_snapshots=recent,
    )

    # Compute baseline multiplier for display
    baseline_multiplier = None
    if len(recent) >= 3 and price_change_pct is not None:
        changes = []
        for i in range(1, len(recent)):
            p, c = recent[i - 1], recent[i]
            if p.price and c.price and p.price > 0:
                changes.append(abs((c.price - p.price) / p.price * 100))
        if changes:
            avg = sum(changes) / len(changes)
            if avg > 0.01:
                baseline_multiplier = round(abs(price_change_pct) / avg, 2)

    data_status = current.data_status if current else "UNAVAILABLE"

    return ChangeDetail(
        symbol=symbol,
        company_name=company_name,
        current_price=current.price if current else None,
        previous_price=previous.price if previous else None,
        price_change_pct=price_change_pct,
        volume_change_pct=volume_change_pct,
        current_volume=current.volume if current else None,
        previous_volume=previous.volume if previous else None,
        attention_score=attention,
        previous_snapshot_time=previous.timestamp if previous else None,
        current_snapshot_time=current.timestamp if current else None,
        data_status=data_status,
        baseline_multiplier=baseline_multiplier,
    )


def get_watchlist_changes(
    db: Session,
    watchlist_id: int,
    watchlist_name: str,
    stocks: List[WatchlistStock],
) -> WatchlistChangeSummary:
    needs_attention = []
    changed = []
    stable = []
    last_checked = None

    for stock in stocks:
        current, previous = get_latest_two_snapshots(db, stock.symbol)
        detail = build_change_detail(db, stock.symbol, stock.company_name, current, previous)

        if current and current.timestamp:
            ts = current.timestamp
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            if last_checked is None or ts > last_checked:
                last_checked = ts

        classification = detail.attention_score.classification
        if classification == "NEEDS_ATTENTION":
            needs_attention.append(detail)
        elif classification == "CHANGED":
            changed.append(detail)
        else:
            stable.append(detail)

    # Sort by score descending within each group
    needs_attention.sort(key=lambda x: x.attention_score.score, reverse=True)
    changed.sort(key=lambda x: x.attention_score.score, reverse=True)

    # Overall data freshness
    all_statuses = [d.data_status for d in needs_attention + changed + stable]
    if "UNAVAILABLE" in all_statuses:
        freshness = "UNAVAILABLE"
    elif "STALE" in all_statuses:
        freshness = "STALE"
    elif "DELAYED" in all_statuses:
        freshness = "DELAYED"
    else:
        freshness = "FRESH"

    return WatchlistChangeSummary(
        watchlist_id=watchlist_id,
        watchlist_name=watchlist_name,
        last_checked=last_checked,
        needs_attention=needs_attention,
        changed=changed,
        stable=stable,
        total_stocks=len(stocks),
        data_freshness=freshness,
    )
