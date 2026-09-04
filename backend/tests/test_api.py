"""Integration tests for API endpoints."""
import pytest
from unittest.mock import patch, AsyncMock
from app.services.market_data_service import MarketDataResult
from datetime import datetime, timezone


def make_mock_market_data(symbol: str, price: float = 150.0) -> MarketDataResult:
    r = MarketDataResult(symbol)
    r.price = price
    r.volume = 10_000_000
    r.day_high = price * 1.02
    r.day_low = price * 0.98
    r.week52_high = price * 1.3
    r.week52_low = price * 0.7
    r.change_percent = 1.5
    r.company_name = f"{symbol} Inc."
    r.data_source = "mock"
    r.data_status = "FRESH"
    r.timestamp = datetime.now(timezone.utc)
    return r


class TestHealth:
    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestAuth:
    def test_demo_login(self, client):
        resp = client.post("/auth/demo")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "user" in data

    def test_register_and_login(self, client):
        resp = client.post("/auth/register", json={"email": "test@example.com", "password": "pass123"})
        assert resp.status_code == 201

        resp = client.post("/auth/login", json={"email": "test@example.com", "password": "pass123"})
        assert resp.status_code == 200

    def test_duplicate_registration(self, client):
        client.post("/auth/register", json={"email": "dup@example.com", "password": "pass123"})
        resp = client.post("/auth/register", json={"email": "dup@example.com", "password": "pass123"})
        assert resp.status_code == 400

    def test_invalid_login(self, client):
        resp = client.post("/auth/login", json={"email": "nobody@example.com", "password": "wrong"})
        assert resp.status_code == 401


class TestWatchlists:
    def test_create_watchlist(self, client):
        resp = client.post("/watchlists", json={"name": "My Portfolio"})
        assert resp.status_code == 201
        assert resp.json()["name"] == "My Portfolio"

    def test_list_watchlists(self, client):
        client.post("/watchlists", json={"name": "WL1"})
        resp = client.get("/watchlists")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_update_watchlist(self, client):
        create_resp = client.post("/watchlists", json={"name": "Old Name"})
        wl_id = create_resp.json()["id"]
        resp = client.put(f"/watchlists/{wl_id}", json={"name": "New Name"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    def test_delete_watchlist(self, client):
        create_resp = client.post("/watchlists", json={"name": "To Delete"})
        wl_id = create_resp.json()["id"]
        resp = client.delete(f"/watchlists/{wl_id}")
        assert resp.status_code == 204

    def test_delete_nonexistent_watchlist(self, client):
        resp = client.delete("/watchlists/99999")
        assert resp.status_code == 404


class TestStocks:
    @patch("app.api.stocks.market_data_service.fetch_stock_data", new_callable=AsyncMock)
    def test_add_stock(self, mock_fetch, client):
        mock_fetch.return_value = make_mock_market_data("AAPL")
        wl = client.post("/watchlists", json={"name": "Tech"}).json()
        resp = client.post(f"/watchlists/{wl['id']}/stocks", json={"symbol": "AAPL"})
        assert resp.status_code == 201
        assert resp.json()["symbol"] == "AAPL"

    @patch("app.api.stocks.market_data_service.fetch_stock_data", new_callable=AsyncMock)
    def test_duplicate_stock_rejected(self, mock_fetch, client):
        mock_fetch.return_value = make_mock_market_data("MSFT")
        wl = client.post("/watchlists", json={"name": "Dup Test"}).json()
        client.post(f"/watchlists/{wl['id']}/stocks", json={"symbol": "MSFT"})
        resp = client.post(f"/watchlists/{wl['id']}/stocks", json={"symbol": "MSFT"})
        assert resp.status_code == 409

    @patch("app.api.stocks.market_data_service.fetch_stock_data", new_callable=AsyncMock)
    def test_remove_stock(self, mock_fetch, client):
        mock_fetch.return_value = make_mock_market_data("TSLA")
        wl = client.post("/watchlists", json={"name": "Remove Test"}).json()
        client.post(f"/watchlists/{wl['id']}/stocks", json={"symbol": "TSLA"})
        resp = client.delete(f"/watchlists/{wl['id']}/stocks/TSLA")
        assert resp.status_code == 204

    @patch("app.api.stocks.market_data_service.fetch_stock_data", new_callable=AsyncMock)
    def test_api_failure_graceful(self, mock_fetch, client):
        """When market API fails, stock can still be added (no snapshot)."""
        failed = MarketDataResult("FAIL")
        failed.error = "Connection error"
        failed.data_status = "UNAVAILABLE"
        mock_fetch.return_value = failed
        wl = client.post("/watchlists", json={"name": "Fail Test"}).json()
        resp = client.post(f"/watchlists/{wl['id']}/stocks", json={"symbol": "FAIL"})
        # Should succeed — stock added, just no snapshot
        assert resp.status_code == 201
