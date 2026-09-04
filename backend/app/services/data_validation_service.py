"""
Data Validation Service
Determines data freshness, detects conflicts, validates snapshots.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.core.config import settings
from app.models.market_snapshot import MarketSnapshot


def get_data_status(timestamp: datetime) -> str:
    """Classify data freshness based on age."""
    now = datetime.now(timezone.utc)
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    age_minutes = (now - timestamp).total_seconds() / 60

    if age_minutes <= settings.DATA_FRESH_MINUTES:
        return "FRESH"
    elif age_minutes <= settings.DATA_DELAYED_MINUTES:
        return "DELAYED"
    else:
        return "STALE"


def is_valid_snapshot(snapshot: MarketSnapshot) -> bool:
    """Check if a snapshot has minimum required data."""
    return snapshot is not None and snapshot.price is not None and snapshot.price > 0


def should_update_snapshot(existing: Optional[MarketSnapshot], new_price: Optional[float]) -> bool:
    """
    Never overwrite valid data with clearly invalid data.
    Returns True if the new data should be persisted.
    """
    if new_price is None:
        return False
    if existing is None:
        return True
    if existing.price is None:
        return True
    # Reject if new price is more than 50% different from last known (likely bad data)
    if existing.price > 0:
        change = abs(new_price - existing.price) / existing.price
        if change > 0.50:
            return False
    return True


def detect_price_conflict(price_a: float, price_b: float, tolerance_pct: float = 1.0) -> bool:
    """Returns True if two prices differ beyond tolerance (conflict detected)."""
    if price_a <= 0 or price_b <= 0:
        return False
    diff_pct = abs(price_a - price_b) / max(price_a, price_b) * 100
    return diff_pct > tolerance_pct


def minutes_since(timestamp: datetime) -> float:
    now = datetime.now(timezone.utc)
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return (now - timestamp).total_seconds() / 60
