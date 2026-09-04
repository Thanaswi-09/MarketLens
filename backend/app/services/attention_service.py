"""
Attention Score Engine
Calculates a transparent, deterministic 0-100 score explaining why a stock deserves attention.

Scoring factors:
  Price movement      → up to 35 points
  Volume anomaly      → up to 30 points
  Volatility          → up to 20 points
  52-week proximity   → up to 15 points

Classification:
  0-30:   STABLE
  31-60:  CHANGED
  61-100: NEEDS_ATTENTION
"""
import math
from typing import Optional, List
from app.schemas.change import ScoreBreakdown, AttentionScore


def _price_score(price_change_pct: Optional[float], baseline_multiplier: Optional[float]) -> tuple[float, str]:
    """
    Score price movement. Max 35 points.
    Uses baseline multiplier if available to contextualize the move.
    """
    if price_change_pct is None:
        return 0.0, "No price data available"

    abs_change = abs(price_change_pct)

    # Base score from raw % move
    if abs_change < 1.0:
        raw_score = abs_change * 5          # 0-5 pts for <1%
    elif abs_change < 3.0:
        raw_score = 5 + (abs_change - 1) * 7.5   # 5-20 pts for 1-3%
    elif abs_change < 7.0:
        raw_score = 20 + (abs_change - 3) * 3.75  # 20-35 pts for 3-7%
    else:
        raw_score = 35.0

    # Amplify if move is unusual relative to baseline
    if baseline_multiplier and baseline_multiplier > 1.5:
        amplifier = min(1.0 + (baseline_multiplier - 1.5) * 0.2, 1.5)
        raw_score = min(raw_score * amplifier, 35.0)

    direction = "+" if price_change_pct >= 0 else ""
    desc = f"{direction}{price_change_pct:.2f}% price movement"
    if baseline_multiplier and baseline_multiplier > 1.5:
        desc += f" ({baseline_multiplier:.1f}× its normal range)"

    return round(raw_score, 1), desc


def _volume_score(volume_change_pct: Optional[float]) -> tuple[float, str]:
    """Score volume anomaly. Max 30 points."""
    if volume_change_pct is None:
        return 0.0, "Volume data unavailable"

    abs_change = abs(volume_change_pct)

    if abs_change < 20:
        score = abs_change * 0.25       # 0-5 pts
    elif abs_change < 50:
        score = 5 + (abs_change - 20) * 0.33   # 5-15 pts
    elif abs_change < 150:
        score = 15 + (abs_change - 50) * 0.15  # 15-30 pts
    else:
        score = 30.0

    direction = "+" if volume_change_pct >= 0 else ""
    desc = f"{direction}{volume_change_pct:.0f}% trading volume change"
    if abs_change > 100:
        desc = f"Unusual trading volume ({direction}{volume_change_pct:.0f}%)"

    return round(score, 1), desc


def _volatility_score(
    price_change_pct: Optional[float],
    day_high: Optional[float],
    day_low: Optional[float],
    price: Optional[float],
) -> tuple[float, str]:
    """Score intraday volatility. Max 20 points."""
    if day_high and day_low and price and price > 0:
        intraday_range_pct = ((day_high - day_low) / price) * 100
        if intraday_range_pct < 1.0:
            score = intraday_range_pct * 4
        elif intraday_range_pct < 3.0:
            score = 4 + (intraday_range_pct - 1) * 5
        elif intraday_range_pct < 6.0:
            score = 14 + (intraday_range_pct - 3) * 2
        else:
            score = 20.0
        return round(min(score, 20.0), 1), f"Intraday range of {intraday_range_pct:.1f}%"

    # Fallback: use price change as proxy
    if price_change_pct is not None:
        score = min(abs(price_change_pct) * 1.5, 20.0)
        return round(score, 1), "Estimated from price movement"

    return 0.0, "Volatility data unavailable"


def _week52_score(
    price: Optional[float],
    week52_high: Optional[float],
    week52_low: Optional[float],
) -> tuple[float, str]:
    """Score proximity to 52-week extremes. Max 15 points."""
    if not price or not week52_high or not week52_low:
        return 0.0, "52-week data unavailable"
    if week52_high <= week52_low or week52_high <= 0:
        return 0.0, "Invalid 52-week data"

    range_size = week52_high - week52_low
    if range_size == 0:
        return 0.0, "No 52-week range"

    # Distance from high (0=at high, 1=at low)
    dist_from_high = (week52_high - price) / range_size
    # Distance from low (0=at low, 1=at high)
    dist_from_low = (price - week52_low) / range_size

    proximity = min(dist_from_high, dist_from_low)  # 0 = at extreme

    if proximity < 0.05:
        score = 15.0
        label = "52-week high" if dist_from_high < dist_from_low else "52-week low"
        desc = f"Price near {label}"
    elif proximity < 0.15:
        score = 10.0
        label = "high" if dist_from_high < dist_from_low else "low"
        desc = f"Price approaching 52-week {label}"
    elif proximity < 0.25:
        score = 5.0
        desc = "Price in notable 52-week range position"
    else:
        score = 0.0
        pct_from_high = dist_from_high * 100
        desc = f"{pct_from_high:.0f}% below 52-week high"

    return round(score, 1), desc


def _compute_baseline_multiplier(
    price_change_pct: Optional[float],
    recent_snapshots: list,
) -> Optional[float]:
    """
    Compare current move to recent normal movement.
    Returns how many times the current move is vs. the stock's recent baseline.
    """
    if price_change_pct is None or len(recent_snapshots) < 3:
        return None

    changes = []
    for i in range(1, len(recent_snapshots)):
        prev = recent_snapshots[i - 1]
        curr = recent_snapshots[i]
        if prev.price and curr.price and prev.price > 0:
            chg = abs((curr.price - prev.price) / prev.price * 100)
            changes.append(chg)

    if not changes:
        return None

    avg_change = sum(changes) / len(changes)
    if avg_change < 0.01:
        return None

    return round(abs(price_change_pct) / avg_change, 2)


def calculate_attention_score(
    price_change_pct: Optional[float],
    volume_change_pct: Optional[float],
    price: Optional[float],
    day_high: Optional[float],
    day_low: Optional[float],
    week52_high: Optional[float],
    week52_low: Optional[float],
    recent_snapshots: list = None,
) -> AttentionScore:
    """
    Main scoring function. Returns AttentionScore with full breakdown.
    """
    recent_snapshots = recent_snapshots or []
    baseline_multiplier = _compute_baseline_multiplier(price_change_pct, recent_snapshots)

    p_score, p_desc = _price_score(price_change_pct, baseline_multiplier)
    v_score, v_desc = _volume_score(volume_change_pct)
    vol_score, vol_desc = _volatility_score(price_change_pct, day_high, day_low, price)
    w_score, w_desc = _week52_score(price, week52_high, week52_low)

    total = p_score + v_score + vol_score + w_score
    total = round(min(total, 100.0), 1)

    breakdown = []
    if p_score > 0:
        breakdown.append(ScoreBreakdown(factor="Price Movement", points=p_score, description=p_desc))
    if v_score > 0:
        breakdown.append(ScoreBreakdown(factor="Volume Anomaly", points=v_score, description=v_desc))
    if vol_score > 0:
        breakdown.append(ScoreBreakdown(factor="Volatility", points=vol_score, description=vol_desc))
    if w_score > 0:
        breakdown.append(ScoreBreakdown(factor="52-Week Position", points=w_score, description=w_desc))

    # Sort by impact
    breakdown.sort(key=lambda x: x.points, reverse=True)

    if total <= 30:
        classification = "STABLE"
        summary = "No significant changes detected. Stock is behaving normally."
    elif total <= 60:
        classification = "CHANGED"
        summary = _build_summary(price_change_pct, volume_change_pct, baseline_multiplier, "moderate")
    else:
        classification = "NEEDS_ATTENTION"
        summary = _build_summary(price_change_pct, volume_change_pct, baseline_multiplier, "significant")

    return AttentionScore(
        score=total,
        classification=classification,
        breakdown=breakdown,
        summary=summary,
    )


def _build_summary(
    price_change_pct: Optional[float],
    volume_change_pct: Optional[float],
    baseline_multiplier: Optional[float],
    level: str,
) -> str:
    parts = []

    if price_change_pct is not None:
        direction = "surged" if price_change_pct > 0 else "declined"
        parts.append(f"Price {direction} {abs(price_change_pct):.1f}%")
        if baseline_multiplier and baseline_multiplier > 1.5:
            parts[-1] += f" ({baseline_multiplier:.1f}× its recent normal range)"

    if volume_change_pct is not None and abs(volume_change_pct) > 30:
        vol_dir = "spike" if volume_change_pct > 0 else "drop"
        parts.append(f"accompanied by a volume {vol_dir} of {abs(volume_change_pct):.0f}%")

    if not parts:
        return f"Stock shows {level} activity."

    return ". ".join(parts) + "."
