import { useState } from 'react';
import { RefreshCw, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { StockCard } from '../components/StockCard';
import { ChangeSummary } from '../components/ChangeSummary';
import { StockSearch } from '../components/StockSearch';
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState';
import { useWatchlist } from '../hooks/useWatchlist';
import { stockApi } from '../services/api';

export function Dashboard() {
  const {
    watchlists, activeId, setActiveId, summary,
    loading, summaryLoading, error,
    createWatchlist, renameWatchlist, deleteWatchlist,
    refresh, loadWatchlists,
  } = useWatchlist();

  const [newWlName, setNewWlName] = useState('');
  const [showNewWl, setShowNewWl] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [addingStock, setAddingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const handleCreateWl = async () => {
    if (!newWlName.trim()) return;
    await createWatchlist(newWlName.trim());
    setNewWlName('');
    setShowNewWl(false);
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    await renameWatchlist(id, editName.trim());
    setEditingId(null);
  };

  const handleAddStock = async (symbol: string, name: string) => {
    if (!activeId) return;
    setAddingStock(true);
    setStockError(null);
    try {
      await stockApi.add(activeId, symbol, name);
      refresh();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to add stock';
      setStockError(msg);
    } finally {
      setAddingStock(false);
    }
  };

  const handleRemoveStock = async (symbol: string) => {
    if (!activeId) return;
    await stockApi.remove(activeId, symbol);
    refresh();
  };

  const allStocks = summary ? [...summary.needs_attention, ...summary.changed, ...summary.stable] : [];

  if (loading) return <LoadingState message="Loading watchlists..." />;
  if (error) return <ErrorState message={error} onRetry={loadWatchlists} />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Don't check every stock. We'll tell you what meaningfully changed.</p>
        </div>
        <button onClick={refresh} disabled={summaryLoading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Watchlist tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {watchlists.map(wl => (
          <div key={wl.id} className="flex items-center gap-1">
            {editingId === wl.id ? (
              <div className="flex items-center gap-1">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(wl.id); if (e.key === 'Escape') setEditingId(null); }}
                  className="px-2 py-1 bg-slate-700 border border-blue-500 rounded text-sm text-white w-32 focus:outline-none" autoFocus />
                <button onClick={() => handleRename(wl.id)} className="p-1 text-emerald-400 hover:text-emerald-300"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button
                onClick={() => setActiveId(wl.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeId === wl.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {wl.name}
                <span className="text-xs opacity-60">({wl.stock_count})</span>
                {activeId === wl.id && (
                  <span className="flex items-center gap-0.5 ml-1">
                    <button onClick={e => { e.stopPropagation(); setEditingId(wl.id); setEditName(wl.name); }}
                      className="opacity-0 group-hover:opacity-100 hover:text-yellow-300 transition-opacity">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteWatchlist(wl.id); }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </button>
            )}
          </div>
        ))}

        {showNewWl ? (
          <div className="flex items-center gap-1">
            <input value={newWlName} onChange={e => setNewWlName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateWl(); if (e.key === 'Escape') setShowNewWl(false); }}
              placeholder="Watchlist name" autoFocus
              className="px-2 py-1 bg-slate-700 border border-blue-500 rounded text-sm text-white w-36 focus:outline-none" />
            <button onClick={handleCreateWl} className="p-1 text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setShowNewWl(false)} className="p-1 text-slate-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => setShowNewWl(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-dashed border-slate-600 hover:border-slate-400 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        )}
      </div>

      {/* Add stock */}
      {activeId && (
        <div className="flex flex-wrap items-center gap-3">
          <StockSearch onSelect={handleAddStock} disabled={addingStock} />
          {addingStock && <span className="text-slate-400 text-sm">Adding...</span>}
          {stockError && <span className="text-red-400 text-sm">{stockError}</span>}
        </div>
      )}

      {/* Summary counters */}
      {summary && <ChangeSummary summary={summary} />}

      {/* Stock grid */}
      {summaryLoading ? (
        <LoadingState message="Fetching latest market data..." />
      ) : !activeId ? (
        <EmptyState title="No watchlist selected" description="Create a watchlist to get started." />
      ) : allStocks.length === 0 ? (
        <EmptyState
          title="Your watchlist is empty"
          description="Search for stocks above to add them to your watchlist."
        />
      ) : (
        <div className="space-y-6">
          {summary && summary.needs_attention.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Needs Attention</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.needs_attention.map(d => (
                  <StockCard key={d.symbol} detail={d} onRemove={() => handleRemoveStock(d.symbol)} />
                ))}
              </div>
            </section>
          )}
          {summary && summary.changed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">Changed</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.changed.map(d => (
                  <StockCard key={d.symbol} detail={d} onRemove={() => handleRemoveStock(d.symbol)} />
                ))}
              </div>
            </section>
          )}
          {summary && summary.stable.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Stable</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.stable.map(d => (
                  <StockCard key={d.symbol} detail={d} onRemove={() => handleRemoveStock(d.symbol)} compact />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
