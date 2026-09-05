import { useState } from 'react';
import { RefreshCw, Plus, Pencil, Trash2, Check, X, TrendingUp } from 'lucide-react';
import { StockCard } from '../components/StockCard';
import { ChangeSummary } from '../components/ChangeSummary';
import { StockSearch } from '../components/StockSearch';
import { SkeletonCard, ErrorState, EmptyState } from '../components/LoadingState';
import { DataStatusBanner } from '../components/DataStatusBadge';
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
    setNewWlName(''); setShowNewWl(false);
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    await renameWatchlist(id, editName.trim());
    setEditingId(null);
  };

  const handleAddStock = async (symbol: string, name: string) => {
    if (!activeId) return;
    setAddingStock(true); setStockError(null);
    try {
      await stockApi.add(activeId, symbol, name);
      refresh();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to add stock';
      setStockError(msg);
    } finally { setAddingStock(false); }
  };

  const handleRemoveStock = async (symbol: string) => {
    if (!activeId) return;
    await stockApi.remove(activeId, symbol);
    refresh();
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  if (error) return <ErrorState message={error} onRetry={loadWatchlists} />;

  const allStocks = summary ? [...summary.needs_attention, ...summary.changed, ...summary.stable] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Hero header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5" style={{ color: '#38BDF8' }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F5F7FA' }}>Dashboard</h1>
          </div>
          <p className="text-sm" style={{ color: '#667085' }}>Know what changed. Know what matters.</p>
        </div>
        <button onClick={refresh} disabled={summaryLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 disabled:opacity-40"
          style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.08)', color: '#9AA4B2' }}
          onMouseEnter={e => { (e.currentTarget.style.backgroundColor = '#1A222D'); (e.currentTarget.style.color = '#F5F7FA'); }}
          onMouseLeave={e => { (e.currentTarget.style.backgroundColor = '#151B23'); (e.currentTarget.style.color = '#9AA4B2'); }}>
          <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Watchlist tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {watchlists.map(wl => (
          <div key={wl.id}>
            {editingId === wl.id ? (
              <div className="flex items-center gap-1">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(wl.id); if (e.key === 'Escape') setEditingId(null); }}
                  className="px-2.5 py-1.5 rounded-lg text-sm outline-none border w-32"
                  style={{ backgroundColor: '#151B23', borderColor: '#38BDF8', color: '#F5F7FA' }} autoFocus />
                <button onClick={() => handleRename(wl.id)} className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#22C55E' }}><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg"
                  style={{ color: '#667085' }}><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => setActiveId(wl.id)}
                className="group flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150"
                style={{
                  backgroundColor: activeId === wl.id ? '#1A222D' : 'transparent',
                  borderColor: activeId === wl.id ? '#38BDF8' : 'rgba(255,255,255,0.08)',
                  color: activeId === wl.id ? '#F5F7FA' : '#9AA4B2',
                }}>
                {wl.name}
                <span className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#667085' }}>
                  {wl.stock_count}
                </span>
                {activeId === wl.id && (
                  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); setEditingId(wl.id); setEditName(wl.name); }}
                      className="p-0.5 rounded hover:text-yellow-400 transition-colors" style={{ color: '#667085' }}>
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteWatchlist(wl.id); }}
                      className="p-0.5 rounded transition-colors" style={{ color: '#667085' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#667085')}>
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
              className="px-2.5 py-1.5 rounded-lg text-sm outline-none border w-36"
              style={{ backgroundColor: '#151B23', borderColor: '#38BDF8', color: '#F5F7FA' }} />
            <button onClick={handleCreateWl} className="p-1.5 rounded-lg" style={{ color: '#22C55E' }}><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setShowNewWl(false)} className="p-1.5 rounded-lg" style={{ color: '#667085' }}><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => setShowNewWl(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm border border-dashed transition-all duration-150"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#667085' }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'); (e.currentTarget.style.color = '#38BDF8'); }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'); (e.currentTarget.style.color = '#667085'); }}>
            <Plus className="w-3.5 h-3.5" /> New Watchlist
          </button>
        )}
      </div>

      {/* Add stock + error */}
      {activeId && (
        <div className="flex flex-wrap items-center gap-3 max-w-sm">
          <StockSearch onSelect={handleAddStock} disabled={addingStock}
            placeholder={addingStock ? 'Adding...' : 'Add stock to watchlist...'} />
          {stockError && (
            <p className="text-xs" style={{ color: '#EF4444' }}>{stockError}</p>
          )}
        </div>
      )}

      {/* Data freshness banner */}
      {summary && summary.data_freshness !== 'FRESH' && (
        <DataStatusBanner status={summary.data_freshness} timestamp={summary.last_checked} />
      )}

      {/* Summary counters */}
      {summary && <ChangeSummary summary={summary} />}

      {/* Stock grid */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !activeId ? (
        <EmptyState title="No watchlist selected" description="Create a watchlist above to get started." />
      ) : allStocks.length === 0 ? (
        <EmptyState title="Your watchlist is empty"
          description="Search for stocks above to start tracking meaningful changes." />
      ) : (
        <div className="space-y-8">
          {summary && summary.needs_attention.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#EF4444' }}>
                  Needs Attention
                </h2>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  {summary.needs_attention.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.needs_attention.map(d => (
                  <StockCard key={d.symbol} detail={d} onRemove={() => handleRemoveStock(d.symbol)} />
                ))}
              </div>
            </section>
          )}

          {summary && summary.changed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F59E0B' }}>Changed</h2>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                  {summary.changed.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.changed.map(d => (
                  <StockCard key={d.symbol} detail={d} onRemove={() => handleRemoveStock(d.symbol)} />
                ))}
              </div>
            </section>
          )}

          {summary && summary.stable.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#667085' }}>Stable</h2>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#667085' }}>
                  {summary.stable.length}
                </span>
              </div>
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
