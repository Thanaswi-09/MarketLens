import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { stockApi } from '../services/api';
import type { SearchResult } from '../types';

interface Props {
  onSelect: (symbol: string, name: string) => void;
  disabled?: boolean;
}

export function StockSearch({ onSelect, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(timer.current);
    if (q.length < 1) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await stockApi.search(q);
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const select = (r: SearchResult) => {
    onSelect(r.symbol, r.name);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={e => search(e.target.value)}
          disabled={disabled}
          placeholder="Search stocks to add..."
          className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">No results found</div>
          ) : (
            results.map(r => (
              <button key={r.symbol} onClick={() => select(r)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-700 transition-colors text-left">
                <div>
                  <span className="text-white font-semibold text-sm">{r.symbol}</span>
                  <span className="text-slate-400 text-xs ml-2">{r.name}</span>
                </div>
                <span className="text-slate-500 text-xs">{r.exchange}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
