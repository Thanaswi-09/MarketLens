from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ScoreBreakdown(BaseModel):
    factor: str
    points: float
    description: str


class AttentionScore(BaseModel):
    score: float
    classification: str  # STABLE, CHANGED, NEEDS_ATTENTION
    breakdown: List[ScoreBreakdown]
    summary: str


class ChangeDetail(BaseModel):
    symbol: str
    company_name: Optional[str]
    current_price: Optional[float]
    previous_price: Optional[float]
    price_change_pct: Optional[float]
    volume_change_pct: Optional[float]
    current_volume: Optional[float]
    previous_volume: Optional[float]
    attention_score: AttentionScore
    previous_snapshot_time: Optional[datetime]
    current_snapshot_time: Optional[datetime]
    data_status: str
    baseline_multiplier: Optional[float] = None  # how many times normal movement


class WatchlistChangeSummary(BaseModel):
    watchlist_id: int
    watchlist_name: str
    last_checked: Optional[datetime]
    needs_attention: List[ChangeDetail]
    changed: List[ChangeDetail]
    stable: List[ChangeDetail]
    total_stocks: int
    data_freshness: str
