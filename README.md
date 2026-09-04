# MarketLens

> **"Don't check every stock. We'll tell you what meaningfully changed."**

MarketLens is a smart market watchlist that answers one question when you return: **what meaningfully changed since you last checked?** It ranks stocks by attention score, explains why each score was given, and surfaces only what deserves your focus.

---

## Problem Statement

Ordinary watchlists show you a list of prices. You still have to inspect every stock yourself to understand what happened. MarketLens solves this by:

- Storing a market snapshot every time you check
- Comparing the current state against your previous snapshot
- Calculating a transparent, explainable **Attention Score (0–100)**
- Grouping stocks into **Needs Attention / Changed / Stable**
- Showing you exactly *why* a stock scored the way it did

---

## Why This Is Different

| Ordinary Watchlist | MarketLens |
|---|---|
| Shows current prices | Shows what *changed* since your last check |
| You inspect every stock | Stocks are ranked by importance |
| No context | Explains *why* a change matters |
| Silent on data issues | Clearly shows FRESH / DELAYED / STALE / UNAVAILABLE |

---

## Features

- Create, rename, delete watchlists
- Add / remove stocks with live symbol search
- Market snapshots persisted to PostgreSQL on every check
- Since-last-check comparison (price %, volume %)
- Attention Score with full breakdown
- "What Changed?" page — meaningful changes at a glance
- Stock detail page with price + volume charts (Recharts)
- Stale / delayed / unavailable data clearly communicated
- Graceful fallback to last verified snapshot on API failure
- Duplicate stock prevention (DB unique constraint)
- Demo user — no login required to try the app

---

## Architecture

```
React + TypeScript (Vite)
    Tailwind CSS + Recharts
        ↓
FastAPI REST API
    SQLAlchemy ORM
        ↓
PostgreSQL
        ↓
Yahoo Finance (primary, no key) → Alpha Vantage (fallback)
```

```mermaid
graph TD
    A[React Frontend] -->|REST| B[FastAPI]
    B --> C[SQLAlchemy]
    C --> D[(PostgreSQL)]
    B --> E[market_data_service]
    E -->|primary| F[Yahoo Finance]
    E -->|fallback| G[Alpha Vantage]
    B --> H[attention_service]
    B --> I[change_detection_service]
    B --> J[data_validation_service]
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Recharts |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Market Data | Yahoo Finance (unofficial), Alpha Vantage |
| Testing | Pytest |

---

## Database Schema

```sql
users (id, email, password_hash, created_at)

watchlists (id, user_id, name, created_at, updated_at)

watchlist_stocks (
  id, watchlist_id, symbol, company_name, added_at
  UNIQUE(watchlist_id, symbol)
)

market_snapshots (
  id, symbol, price, volume, market_cap,
  day_high, day_low, week52_high, week52_low,
  change_percent, avg_volume,
  timestamp, data_source, data_status
  INDEX(symbol, timestamp)
)
```

---

## Meaningful Change Algorithm

Every time you open the watchlist, the backend:

1. Fetches fresh market data for each stock
2. Persists a new snapshot (if data is valid and not a >50% price jump)
3. Compares the latest two snapshots per symbol
4. Calculates price change % and volume change %
5. Runs the Attention Score engine

### Attention Score (0–100)

| Factor | Max Points | Logic |
|---|---|---|
| Price Movement | 35 | Scaled by magnitude; amplified if above personal baseline |
| Volume Anomaly | 30 | Scaled by % deviation from previous volume |
| Volatility | 20 | Intraday high-low range as % of price |
| 52-Week Position | 15 | Proximity to 52-week high or low |

**Classification:**
- 0–30 → `STABLE`
- 31–60 → `CHANGED`
- 61–100 → `NEEDS_ATTENTION`

### Personal Baseline

If ≥3 historical snapshots exist, the engine computes the stock's average recent daily movement. If the current move is significantly larger (e.g. 4×), the price score is amplified and the explanation says "4.1× its normal movement."

---

## Stale / Conflicting Data Handling

| Age | Status |
|---|---|
| < 5 min | `FRESH` |
| 5–15 min | `DELAYED` |
| > 15 min | `STALE` |
| API failure | `UNAVAILABLE` |

- UI shows a warning banner for non-FRESH data
- If live data is unavailable, the last verified snapshot is shown
- New data that differs >50% from the last known price is rejected (likely bad data)
- The app never crashes on API failure

---

## API Documentation

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/demo` | One-click demo login |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |

### Watchlists
| Method | Endpoint | Description |
|---|---|---|
| GET | `/watchlists` | List watchlists |
| POST | `/watchlists` | Create watchlist |
| PUT | `/watchlists/{id}` | Rename watchlist |
| DELETE | `/watchlists/{id}` | Delete watchlist |

### Stocks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/watchlists/{id}/stocks` | List stocks |
| POST | `/watchlists/{id}/stocks` | Add stock |
| DELETE | `/watchlists/{id}/stocks/{symbol}` | Remove stock |
| GET | `/stocks/search?q=` | Search symbols |
| GET | `/stocks/{symbol}` | Stock detail + attention score |
| GET | `/stocks/{symbol}/history` | Snapshot history |

### Changes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/watchlists/{id}/changes?refresh=true` | What changed since last check |
| GET | `/stocks/{symbol}/changes` | Changes for a single stock |

### Health
| Method | Endpoint |
|---|---|
| GET | `/health` |

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

### 1. Create the database

```sql
CREATE DATABASE marketlens;
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

### 3. Environment variables

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/marketlens
MARKET_API_KEY=your_alpha_vantage_key   # optional, Yahoo Finance works without a key
SECRET_KEY=change-this-in-production
DATA_FRESH_MINUTES=5
DATA_DELAYED_MINUTES=15
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. Frontend

```bash
cd frontend
npm install
```

---

## Running the Application

### Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm run dev
```

App available at: http://localhost:5173

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Tests cover:
- Price / volume change calculation
- Attention score classification
- Score breakdown explainability
- Stale data detection
- Invalid snapshot rejection
- Duplicate stock prevention
- Watchlist CRUD
- API failure graceful handling
- Auth flows

---

## Design Decisions

- **Yahoo Finance first** — no API key required, works immediately out of the box
- **Alpha Vantage fallback** — more reliable for production if a key is provided
- **Demo user** — no login friction for competition demo
- **Header-based auth** — simple `x-user-id` header, extensible to JWT
- **50% price jump rejection** — prevents bad API data from overwriting valid snapshots
- **Snapshot-based comparison** — "since last check" is meaningful because we store state, not just current prices

---

## Known Limitations

- Yahoo Finance unofficial endpoint may be rate-limited or blocked in some regions
- Charts only show stored snapshots (not intraday tick data)
- No real-time WebSocket updates — refresh is manual
- Auth is demo-mode only (no JWT, no sessions)

---

## Future Improvements

- JWT authentication
- WebSocket live price updates
- Email / push alerts when attention score crosses threshold
- Multiple data provider comparison with conflict detection UI
- Portfolio-level summary view
- Export watchlist to CSV
