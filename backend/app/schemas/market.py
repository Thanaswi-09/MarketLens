from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.schemas.change import AttentionScore


class StockQuote(BaseModel):
    symbol: str
    company_name: Optional[str]
    price: Optional[float]
    volume: Optional[float]
    market_cap: Optional[float]
    day_high: Optional[float]
    day_low: Optional[float]
    week52_high: Optional[float]
    week52_low: Optional[float]
    change_percent: Optional[float]
    avg_volume: Optional[float]
    timestamp: datetime
    data_source: str
    data_status: str  # FRESH, DELAYED, STALE, UNAVAILABLE


class StockDetailOut(BaseModel):
    quote: StockQuote
    attention_score: Optional[AttentionScore]
    price_history: List[dict]
    volume_history: List[dict]
    snapshots: List[dict]
