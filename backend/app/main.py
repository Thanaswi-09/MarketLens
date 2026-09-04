from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import init_db
from app.api import auth, watchlists, stocks, changes

app = FastAPI(
    title="MarketLens API",
    description="Smart Market Watchlist - understand what meaningfully changed since your last check.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(watchlists.router)
app.include_router(stocks.router)
app.include_router(changes.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok", "service": "MarketLens API"}
