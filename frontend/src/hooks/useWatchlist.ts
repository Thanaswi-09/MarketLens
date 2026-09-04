import { useState, useEffect, useCallback } from 'react';
import { watchlistApi, changesApi, authApi } from '../services/api';
import type { Watchlist, WatchlistChangeSummary } from '../types';

export function useWatchlist() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [summary, setSummary] = useState<WatchlistChangeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure demo user exists
  useEffect(() => {
    if (!localStorage.getItem('user_id')) {
      authApi.demoLogin().then((data: { user: { id: number } }) => {
        localStorage.setItem('user_id', String(data.user.id));
      }).catch(() => {});
    }
  }, []);

  const loadWatchlists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await watchlistApi.list();
      setWatchlists(data);
      if (data.length > 0 && !activeId) setActiveId(data[0].id);
    } catch {
      setError('Failed to load watchlists');
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  const loadSummary = useCallback(async (id: number, refresh = true) => {
    setSummaryLoading(true);
    try {
      const data = await changesApi.get(id, refresh);
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => { loadWatchlists(); }, []);

  useEffect(() => {
    if (activeId) loadSummary(activeId);
  }, [activeId]);

  const createWatchlist = async (name: string) => {
    const wl = await watchlistApi.create(name);
    setWatchlists(prev => [...prev, wl]);
    setActiveId(wl.id);
  };

  const renameWatchlist = async (id: number, name: string) => {
    const wl = await watchlistApi.update(id, name);
    setWatchlists(prev => prev.map(w => w.id === id ? wl : w));
  };

  const deleteWatchlist = async (id: number) => {
    await watchlistApi.delete(id);
    const remaining = watchlists.filter(w => w.id !== id);
    setWatchlists(remaining);
    if (activeId === id) setActiveId(remaining[0]?.id ?? null);
  };

  const refresh = () => { if (activeId) loadSummary(activeId, true); };

  return {
    watchlists, activeId, setActiveId,
    summary, loading, summaryLoading, error,
    createWatchlist, renameWatchlist, deleteWatchlist,
    refresh, loadWatchlists,
  };
}
