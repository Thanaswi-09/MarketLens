import axios from 'axios';
import type {
  Watchlist, StockOut, WatchlistChangeSummary,
  StockDetail, SearchResult
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach user id header (demo mode)
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('user_id');
  if (userId) config.headers['x-user-id'] = userId;
  return config;
});

export const authApi = {
  demoLogin: () => api.post('/auth/demo').then(r => r.data),
};

export const watchlistApi = {
  list: (): Promise<Watchlist[]> => api.get('/watchlists').then(r => r.data),
  create: (name: string): Promise<Watchlist> => api.post('/watchlists', { name }).then(r => r.data),
  update: (id: number, name: string): Promise<Watchlist> => api.put(`/watchlists/${id}`, { name }).then(r => r.data),
  delete: (id: number): Promise<void> => api.delete(`/watchlists/${id}`).then(r => r.data),
};

export const stockApi = {
  list: (watchlistId: number): Promise<StockOut[]> =>
    api.get(`/watchlists/${watchlistId}/stocks`).then(r => r.data),
  add: (watchlistId: number, symbol: string, company_name?: string): Promise<StockOut> =>
    api.post(`/watchlists/${watchlistId}/stocks`, { symbol, company_name }).then(r => r.data),
  remove: (watchlistId: number, symbol: string): Promise<void> =>
    api.delete(`/watchlists/${watchlistId}/stocks/${symbol}`).then(r => r.data),
  search: (q: string): Promise<SearchResult[]> =>
    api.get('/stocks/search', { params: { q } }).then(r => r.data),
  detail: (symbol: string): Promise<StockDetail> =>
    api.get(`/stocks/${symbol}`).then(r => r.data),
};

export const changesApi = {
  get: (watchlistId: number, refresh = true): Promise<WatchlistChangeSummary> =>
    api.get(`/watchlists/${watchlistId}/changes`, { params: { refresh } }).then(r => r.data),
};
