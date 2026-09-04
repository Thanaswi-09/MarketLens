from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from sqlalchemy.sql import func
from app.db.database import Base


class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    price = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)
    day_high = Column(Float, nullable=True)
    day_low = Column(Float, nullable=True)
    week52_high = Column(Float, nullable=True)
    week52_low = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)
    avg_volume = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    data_source = Column(String(50), nullable=True)
    data_status = Column(String(20), default="FRESH")  # FRESH, DELAYED, STALE, UNAVAILABLE

    __table_args__ = (
        Index("ix_market_snapshots_symbol_timestamp", "symbol", "timestamp"),
    )
