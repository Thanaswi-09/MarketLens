"""Tests for the core business logic: attention scoring and change detection."""
import pytest
from app.services.attention_service import calculate_attention_score, _price_score, _volume_score
from app.services.change_detection_service import _pct_change


# ── Price change calculation ──────────────────────────────────────────────────

class TestPctChange:
    def test_positive_change(self):
        assert _pct_change(108, 100) == 8.0

    def test_negative_change(self):
        assert _pct_change(92, 100) == -8.0

    def test_no_change(self):
        assert _pct_change(100, 100) == 0.0

    def test_zero_previous(self):
        assert _pct_change(100, 0) is None

    def test_none_current(self):
        assert _pct_change(None, 100) is None

    def test_none_previous(self):
        assert _pct_change(100, None) is None

    def test_large_gain(self):
        result = _pct_change(200, 100)
        assert result == 100.0

    def test_total_loss(self):
        result = _pct_change(0, 100)
        assert result == -100.0


# ── Price score ───────────────────────────────────────────────────────────────

class TestPriceScore:
    def test_no_movement(self):
        score, _ = _price_score(0.0, None)
        assert score == 0.0

    def test_small_movement(self):
        score, _ = _price_score(0.5, None)
        assert 0 < score < 10

    def test_moderate_movement(self):
        score, _ = _price_score(2.0, None)
        assert 10 <= score <= 25

    def test_large_movement(self):
        score, _ = _price_score(7.0, None)
        assert score == 35.0

    def test_max_capped_at_35(self):
        score, _ = _price_score(50.0, None)
        assert score == 35.0

    def test_none_returns_zero(self):
        score, _ = _price_score(None, None)
        assert score == 0.0

    def test_baseline_amplifies_score(self):
        score_no_baseline, _ = _price_score(2.0, None)
        score_with_baseline, _ = _price_score(2.0, 4.0)  # 4x normal
        assert score_with_baseline > score_no_baseline

    def test_negative_movement_same_as_positive(self):
        score_pos, _ = _price_score(5.0, None)
        score_neg, _ = _price_score(-5.0, None)
        assert score_pos == score_neg


# ── Volume score ──────────────────────────────────────────────────────────────

class TestVolumeScore:
    def test_no_volume_change(self):
        score, _ = _volume_score(0.0)
        assert score == 0.0

    def test_small_volume_change(self):
        score, _ = _volume_score(10.0)
        assert 0 < score < 5

    def test_large_volume_spike(self):
        score, _ = _volume_score(200.0)
        assert score == 30.0

    def test_none_returns_zero(self):
        score, _ = _volume_score(None)
        assert score == 0.0

    def test_negative_volume_change(self):
        score, _ = _volume_score(-80.0)
        assert score > 0  # Volume drop is also notable


# ── Attention score classification ───────────────────────────────────────────

class TestAttentionScore:
    def test_stable_classification(self):
        result = calculate_attention_score(
            price_change_pct=0.3,
            volume_change_pct=5.0,
            price=100,
            day_high=101,
            day_low=99,
            week52_high=150,
            week52_low=80,
        )
        assert result.classification == "STABLE"
        assert result.score <= 30

    def test_needs_attention_classification(self):
        result = calculate_attention_score(
            price_change_pct=8.0,
            volume_change_pct=250.0,
            price=100,
            day_high=110,
            day_low=95,
            week52_high=105,
            week52_low=60,
        )
        assert result.classification == "NEEDS_ATTENTION"
        assert result.score > 60

    def test_changed_classification(self):
        result = calculate_attention_score(
            price_change_pct=2.5,
            volume_change_pct=60.0,
            price=100,
            day_high=103,
            day_low=98,
            week52_high=150,
            week52_low=80,
        )
        assert result.classification in ("CHANGED", "NEEDS_ATTENTION")

    def test_score_between_0_and_100(self):
        result = calculate_attention_score(
            price_change_pct=100.0,
            volume_change_pct=10000.0,
            price=100,
            day_high=200,
            day_low=50,
            week52_high=101,
            week52_low=50,
        )
        assert 0 <= result.score <= 100

    def test_all_none_inputs(self):
        result = calculate_attention_score(
            price_change_pct=None,
            volume_change_pct=None,
            price=None,
            day_high=None,
            day_low=None,
            week52_high=None,
            week52_low=None,
        )
        assert result.score == 0.0
        assert result.classification == "STABLE"

    def test_breakdown_is_explainable(self):
        result = calculate_attention_score(
            price_change_pct=6.0,
            volume_change_pct=180.0,
            price=100,
            day_high=108,
            day_low=94,
            week52_high=102,
            week52_low=60,
        )
        assert len(result.breakdown) > 0
        assert all(b.points > 0 for b in result.breakdown)
        assert result.summary != ""

    def test_missing_previous_snapshot(self):
        """When there's no previous snapshot, score should still work."""
        result = calculate_attention_score(
            price_change_pct=None,
            volume_change_pct=None,
            price=150.0,
            day_high=155.0,
            day_low=148.0,
            week52_high=160.0,
            week52_low=100.0,
        )
        assert result is not None
        assert 0 <= result.score <= 100


# ── Data validation ───────────────────────────────────────────────────────────

class TestDataValidation:
    def test_stale_data_detection(self):
        from datetime import datetime, timezone, timedelta
        from app.services.data_validation_service import get_data_status

        fresh_time = datetime.now(timezone.utc)
        assert get_data_status(fresh_time) == "FRESH"

        delayed_time = datetime.now(timezone.utc) - timedelta(minutes=10)
        assert get_data_status(delayed_time) == "DELAYED"

        stale_time = datetime.now(timezone.utc) - timedelta(minutes=30)
        assert get_data_status(stale_time) == "STALE"

    def test_invalid_snapshot_not_overwritten(self):
        from app.services.data_validation_service import should_update_snapshot
        from app.models.market_snapshot import MarketSnapshot

        existing = MarketSnapshot(symbol="AAPL", price=100.0)
        # 60% jump — should be rejected as likely bad data
        assert should_update_snapshot(existing, 160.0) is False
        # Normal movement — should be accepted
        assert should_update_snapshot(existing, 105.0) is True

    def test_none_new_price_not_persisted(self):
        from app.services.data_validation_service import should_update_snapshot
        assert should_update_snapshot(None, None) is False
