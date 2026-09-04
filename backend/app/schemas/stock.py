from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StockAdd(BaseModel):
    symbol: str
    company_name: Optional[str] = None


class StockOut(BaseModel):
    id: int
    symbol: str
    company_name: Optional[str]
    added_at: datetime

    model_config = {"from_attributes": True}


class MarketSnapshotOut(BaseModel):
    id: int
    symbol: str
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
    data_source: Optional[str]
    data_status: str

    model_config = {"from_attributes": True}
