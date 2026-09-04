import { useState, useEffect } from 'react';
import { stockApi } from '../services/api';
import type { StockDetail } from '../types';

export function useStock(symbol: string | null) {
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    stockApi.detail(symbol)
      .then(setDetail)
      .catch(() => setError('Failed to load stock data'))
      .finally(() => setLoading(false));
  }, [symbol]);

  return { detail, loading, error };
}
