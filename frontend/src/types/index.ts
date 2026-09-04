export interface Watchlist {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  stock_count: number;
}

export interface StockOut {
  id: number;
  symbol: string;
  company_name: string | null;
  added_at: string;
}

export interface ScoreBreakdown {
  factor: string;
  points: number;
  description: string;
}

export interface AttentionScore {
  score: number;
  classification: 'STABLE' | 'CHANGED' | 'NEEDS_ATTENTION';
  breakdown: ScoreBreakdown[];
  summary: string;
}

export interface ChangeDetail {
  symbol: string;
  company_name: string | null;
  current_price: number | null;
  previous_price: number | null;
  price_change_pct: number | null;
  volume_change_pct: number | null;
  current_volume: number | null;
  previous_volume: number | null;
  attention_score: AttentionScore;
  previous_snapshot_time: string | null;
  current_snapshot_time: string | null;
  data_status: 'FRESH' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
  baseline_multiplier: number | null;
}

export interface WatchlistChangeSummary {
  watchlist_id: number;
  watchlist_name: string;
  last_checked: string | null;
  needs_attention: ChangeDetail[];
  changed: ChangeDetail[];
  stable: ChangeDetail[];
  total_stocks: number;
  data_freshness: 'FRESH' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
}

export interface StockQuote {
  symbol: string;
  company_name: string | null;
  price: number | null;
  volume: number | null;
  market_cap: number | null;
  day_high: number | null;
  day_low: number | null;
  week52_high: number | null;
  week52_low: number | null;
  change_percent: number | null;
  avg_volume: number | null;
  timestamp: string;
  data_source: string;
  data_status: 'FRESH' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
}

export interface StockDetail {
  quote: StockQuote;
  attention_score: AttentionScore | null;
  price_history: { time: string; price: number }[];
  volume_history: { time: string; volume: number }[];
  snapshots: { id: number; timestamp: string; price: number; volume: number; data_status: string }[];
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}
