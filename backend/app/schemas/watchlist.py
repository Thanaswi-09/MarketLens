from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class WatchlistCreate(BaseModel):
    name: str


class WatchlistUpdate(BaseModel):
    name: str


class WatchlistOut(BaseModel):
    id: int
    name: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    stock_count: Optional[int] = 0

    model_config = {"from_attributes": True}
