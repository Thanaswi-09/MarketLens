"""
Market Data Service
Fetches, normalizes, and validates stock data from external APIs.
Primary: Alpha Vantage
Fallback: Mock provider for local testing
"""
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

# Validation bounds
MIN_PRICE = 0.001
MAX_PRICE = 1_000_000
MAX_VOLUME = 100_000_000_000


class MarketDataResult:
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.company_name: Optional[str] = None
        self.price: Optional[float] = None
        self.volume: Optional[float] = None
        self.market_cap: Optional[float] = None
        self.day_high: Optional[float] = None
        self.day_low: Optional[float] = None
        self.week52_high: Optional[float] = None
        self.week52_low: Optional[float] = None
        self.change_percent: Optional[float] = None
        self.avg_volume: Optional[float] = None
        self.timestamp: datetime = datetime.now(timezone.utc)
        self.data_source: str = "unknown"
        self.data_status: str = "UNAVAILABLE"
        self.error: Optional[str] = None


def _safe_float(value: Any, min_val: float = None, max_val: float = None) -> Optional[float]:
    try:
        f = float(value)
        if f != f:  # NaN check
            return None
        if min_val is not None and f < min_val:
            return None
        if max_val is not None and f > max_val:
            return None
        return f
    except (TypeError, ValueError):
        return None


def _validate_result(result: MarketDataResult) -> MarketDataResult:
    """Reject impossible values, preserve None for missing fields."""
    result.price = _safe_float(result.price, MIN_PRICE, MAX_PRICE)
    result.volume = _safe_float(result.volume, 0, MAX_VOLUME)
    result.day_high = _safe_float(result.day_high, MIN_PRICE, MAX_PRICE)
    result.day_low = _safe_float(result.day_low, MIN_PRICE, MAX_PRICE)
    result.week52_high = _safe_float(result.week52_high, MIN_PRICE, MAX_PRICE)
    result.week52_low = _safe_float(result.week52_low, MIN_PRICE, MAX_PRICE)
    result.market_cap = _safe_float(result.market_cap, 0)
    result.avg_volume = _safe_float(result.avg_volume, 0, MAX_VOLUME)

    # Sanity: high >= low
    if result.day_high and result.day_low and result.day_high < result.day_low:
        result.day_high, result.day_low = None, None

    return result


async def fetch_alpha_vantage(symbol: str) -> MarketDataResult:
    result = MarketDataResult(symbol)
    result.data_source = "alpha_vantage"

    if not settings.MARKET_API_KEY:
        result.error = "No API key configured"
        return result

    url = "https://www.alphavantage.co/query"
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": settings.MARKET_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        if "Note" in data:
            result.error = "API rate limit reached"
            return result

        if "Error Message" in data:
            result.error = f"Invalid symbol: {symbol}"
            return result

        quote = data.get("Global Quote", {})
        if not quote or not quote.get("05. price"):
            result.error = "Empty response from API"
            return result

        result.price = _safe_float(quote.get("05. price"))
        result.volume = _safe_float(quote.get("06. volume"))
        result.day_high = _safe_float(quote.get("03. high"))
        result.day_low = _safe_float(quote.get("04. low"))
        result.change_percent = _safe_float(
            str(quote.get("10. change percent", "0")).replace("%", "")
        )

        # Fetch overview for additional data
        overview_params = {
            "function": "OVERVIEW",
            "symbol": symbol,
            "apikey": settings.MARKET_API_KEY,
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                ov_resp = await client.get(url, params=overview_params)
                ov_data = ov_resp.json()

            result.company_name = ov_data.get("Name")
            result.market_cap = _safe_float(ov_data.get("MarketCapitalization"))
            result.week52_high = _safe_float(ov_data.get("52WeekHigh"))
            result.week52_low = _safe_float(ov_data.get("52WeekLow"))
            result.avg_volume = _safe_float(ov_data.get("50DayMovingAverage"))
        except Exception:
            pass  # Overview is optional

        result.timestamp = datetime.now(timezone.utc)
        result.data_status = "FRESH"

    except httpx.TimeoutException:
        result.error = "Request timed out"
    except httpx.HTTPStatusError as e:
        result.error = f"HTTP error: {e.response.status_code}"
    except Exception as e:
        result.error = f"Unexpected error: {str(e)}"
        logger.exception("Alpha Vantage fetch error for %s", symbol)

    return result


async def fetch_yahoo_finance(symbol: str) -> MarketDataResult:
    """Secondary provider using Yahoo Finance unofficial endpoint."""
    result = MarketDataResult(symbol)
    result.data_source = "yahoo_finance"

    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    headers = {"User-Agent": "Mozilla/5.0"}
    params = {"interval": "1d", "range": "1d"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        chart = data.get("chart", {})
        if chart.get("error"):
            result.error = str(chart["error"])
            return result

        res = chart.get("result", [])
        if not res:
            result.error = "No data returned"
            return result

        meta = res[0].get("meta", {})
        result.price = _safe_float(meta.get("regularMarketPrice"))
        result.volume = _safe_float(meta.get("regularMarketVolume"))
        result.day_high = _safe_float(meta.get("regularMarketDayHigh"))
        result.day_low = _safe_float(meta.get("regularMarketDayLow"))
        result.week52_high = _safe_float(meta.get("fiftyTwoWeekHigh"))
        result.week52_low = _safe_float(meta.get("fiftyTwoWeekLow"))
        result.market_cap = _safe_float(meta.get("marketCap"))
        result.avg_volume = _safe_float(meta.get("averageDailyVolume10Day"))
        result.company_name = meta.get("longName") or meta.get("shortName")

        prev_close = _safe_float(meta.get("chartPreviousClose")) or _safe_float(meta.get("previousClose"))
        if result.price and prev_close and prev_close > 0:
            result.change_percent = ((result.price - prev_close) / prev_close) * 100

        result.timestamp = datetime.now(timezone.utc)
        result.data_status = "FRESH"

    except httpx.TimeoutException:
        result.error = "Request timed out"
    except httpx.HTTPStatusError as e:
        result.error = f"HTTP error: {e.response.status_code}"
    except Exception as e:
        result.error = f"Unexpected error: {str(e)}"
        logger.exception("Yahoo Finance fetch error for %s", symbol)

    return result


async def fetch_stock_data(symbol: str) -> MarketDataResult:
    """
    Main entry point. Tries Yahoo Finance first (no key needed),
    falls back to Alpha Vantage if configured.
    """
    symbol = symbol.upper().strip()

    # Try Yahoo Finance first (no API key required)
    result = await fetch_yahoo_finance(symbol)
    if result.price is not None:
        result = _validate_result(result)
        return result

    logger.warning("Yahoo Finance failed for %s: %s. Trying Alpha Vantage.", symbol, result.error)

    # Try Alpha Vantage if key is configured
    if settings.MARKET_API_KEY:
        result = await fetch_alpha_vantage(symbol)
        if result.price is not None:
            result = _validate_result(result)
            return result

    logger.error("All providers failed for %s", symbol)
    result.data_status = "UNAVAILABLE"
    return result


async def search_symbol(query: str) -> list[Dict[str, str]]:
    """Search for stock symbols by name or ticker."""
    url = "https://query1.finance.yahoo.com/v1/finance/search"
    headers = {"User-Agent": "Mozilla/5.0"}
    params = {"q": query, "quotesCount": 8, "newsCount": 0}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for item in data.get("quotes", []):
            if item.get("quoteType") in ("EQUITY", "ETF"):
                results.append({
                    "symbol": item.get("symbol", ""),
                    "name": item.get("longname") or item.get("shortname") or "",
                    "exchange": item.get("exchange", ""),
                    "type": item.get("quoteType", ""),
                })
        return results
    except Exception as e:
        logger.warning("Symbol search failed: %s", e)
        return []
