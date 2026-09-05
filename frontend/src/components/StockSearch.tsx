import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { stockApi } from '../services/api';
import type { SearchResult } from '../types';

interface Props {
  onSelect: (symbol: string, name: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function StockSearch({ onSelect, disabled, placeholder = 'Search stocks...' }: Props) {
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
    <div ref={ref} className="relative w-full">
      <div className="relative">
        {loading
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: '#38BDF8' }} />
          : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#667085' }} />
        }
        <input
          value={query}
          onChange={e => search(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 rounded-lg text-sm outline-none transition-all duration-150 border"
          style={{
            backgroundColor: '#151B23',
            borderColor: open ? '#38BDF8' : 'rgba(255,255,255,0.08)',
            color: '#F5F7FA',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#38BDF8')}
          onBlur={e => { if (!open) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
            style={{ color: '#667085' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border shadow-2xl overflow-hidden"
          style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          {loading ? (
            <div className="px-4 py-3 text-sm flex items-center gap-2" style={{ color: '#667085' }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: '#667085' }}>No matching stocks found.</div>
          ) : (
            results.map((r) => (
              <button key={r.symbol} onClick={() => select(r)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b last:border-0"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1A222D')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#1A222D', color: '#38BDF8' }}>
                    {r.symbol.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>{r.symbol}</p>
                    <p className="text-xs truncate max-w-[200px]" style={{ color: '#9AA4B2' }}>{r.name}</p>
                  </div>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1A222D', color: '#667085' }}>{r.exchange}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
