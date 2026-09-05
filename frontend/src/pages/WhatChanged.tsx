import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight, GitCompare } from 'lucide-react';
import { AttentionBadge } from '../components/AttentionBadge';
import { LoadingState, EmptyState } from '../components/LoadingState';
import { useWatchlist } from '../hooks/useWatchlist';
import type { ChangeDetail } from '../types';

type Filter = 'all' | 'attention' | 'changed' | 'stable';

function fmtPct(n: number | null) {
  if (n == null) return null;
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function RankRow({ detail, rank }: { detail: ChangeDetail; rank: number }) {
  const navigate = useNavigate();
  const { symbol, company_name, current_price, price_change_pct, volume_change_pct, attention_score, baseline_multiplier } = detail;
  const priceUp = (price_change_pct ?? 0) >= 0;
  const isAttention = attention_score.classification === 'NEEDS_ATTENTION';
  const isChanged = attention_score.classification === 'CHANGED';

  const scoreColor = isAttention ? '#EF4444' : isChanged ? '#F59E0B' : '#22C55E';

  return (
    <div onClick={() => navigate(`/stocks/${symbol}`)}
      className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-150 group"
      style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.06)' }}
      onMouseEnter={e => { (e.currentTarget.style.backgroundColor = '#1A222D'); (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'); }}
      onMouseLeave={e => { (e.currentTarget.style.backgroundColor = '#151B23'); (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'); }}>

      {/* Rank */}
      <span className="text-sm font-bold w-6 text-center tabular-nums" style={{ color: '#667085' }}>
        {String(rank).padStart(2, '0')}
      </span>

      {/* Symbol + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm" style={{ color: '#F5F7FA' }}>{symbol}</span>
          <AttentionBadge score={attention_score} />
        </div>
        {company_name && <p className="text-xs truncate" style={{ color: '#667085' }}>{company_name}</p>}
      </div>

      {/* Price */}
      <div className="text-right hidden sm:block">
        <p className="text-sm font-semibold tabular-nums" style={{ color: '#F5F7FA' }}>
          {current_price != null ? `$${current_price.toFixed(2)}` : '—'}
        </p>
      </div>

      {/* Price change */}
      {price_change_pct != null && (
        <div className="text-right w-20">
          <p className="text-sm font-bold tabular-nums flex items-center justify-end gap-0.5"
            style={{ color: priceUp ? '#22C55E' : '#EF4444' }}>
            {priceUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {fmtPct(price_change_pct)}
          </p>
          {baseline_multiplier && baseline_multiplier > 1.5 && (
            <p className="text-xs tabular-nums" style={{ color: '#F59E0B' }}>{baseline_multiplier.toFixed(1)}× normal</p>
          )}
        </div>
      )}

      {/* Volume */}
      {volume_change_pct != null && (
        <div className="text-right w-20 hidden md:block">
          <p className="text-xs" style={{ color: '#9AA4B2' }}>Volume</p>
          <p className="text-sm font-medium tabular-nums"
            style={{ color: (volume_change_pct ?? 0) >= 0 ? '#38BDF8' : '#F97316' }}>
            {fmtPct(volume_change_pct)}
          </p>
        </div>
      )}

      {/* Score */}
      <div className="text-right w-16 hidden sm:block">
        <p className="text-xs" style={{ color: '#667085' }}>Score</p>
        <p className="text-sm font-bold tabular-nums" style={{ color: scoreColor }}>
          {Math.round(attention_score.score)}
        </p>
      </div>

      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#38BDF8' }} />
    </div>
  );
}

export function WhatChanged() {
  const { watchlists, activeId, setActiveId, summary, summaryLoading } = useWatchlist();
  const [filter, setFilter] = useState<Filter>('all');

  const allMeaningful = summary ? [...summary.needs_attention, ...summary.changed] : [];
  const stable = summary?.stable ?? [];

  const filtered = filter === 'attention' ? (summary?.needs_attention ?? [])
    : filter === 'changed' ? (summary?.changed ?? [])
    : filter === 'stable' ? stable
    : allMeaningful;

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all',       label: 'All Changes',     count: allMeaningful.length },
    { key: 'attention', label: 'Needs Attention',  count: summary?.needs_attention.length ?? 0 },
    { key: 'changed',   label: 'Changed',          count: summary?.changed.length ?? 0 },
    { key: 'stable',    label: 'Stable',           count: stable.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GitCompare className="w-5 h-5" style={{ color: '#38BDF8' }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F5F7FA' }}>What Changed?</h1>
        </div>
        <p className="text-sm" style={{ color: '#667085' }}>
          {summary?.last_checked
            ? `Meaningful market movements since your last check at ${new Date(summary.last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Meaningful market movements since your last check.'}
        </p>
      </div>

      {/* Watchlist selector */}
      {watchlists.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {watchlists.map(wl => (
            <button key={wl.id} onClick={() => setActiveId(wl.id)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150"
              style={{
                backgroundColor: activeId === wl.id ? '#1A222D' : 'transparent',
                borderColor: activeId === wl.id ? '#38BDF8' : 'rgba(255,255,255,0.08)',
                color: activeId === wl.id ? '#F5F7FA' : '#9AA4B2',
              }}>
              {wl.name}
            </button>
          ))}
        </div>
      )}

      {summaryLoading ? (
        <LoadingState message="Analyzing changes..." />
      ) : !summary ? (
        <EmptyState title="No watchlist selected" description="Select a watchlist to see what changed." />
      ) : allMeaningful.length === 0 && stable.length === 0 ? (
        <EmptyState title="No stocks in watchlist" description="Add stocks from the Dashboard." />
      ) : (
        <div className="space-y-6">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
                style={{
                  backgroundColor: filter === f.key ? '#1A222D' : 'transparent',
                  borderColor: filter === f.key ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.06)',
                  color: filter === f.key ? '#F5F7FA' : '#9AA4B2',
                }}>
                {f.label}
                <span className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#667085' }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Meaningful changes */}
          {(filter === 'all' || filter === 'attention' || filter === 'changed') && (
            <>
              {filtered.length > 0 ? (
                <div className="space-y-2">
                  {filtered.map((d, i) => <RankRow key={d.symbol} detail={d} rank={i + 1} />)}
                </div>
              ) : (
                <div className="p-4 rounded-xl border text-sm flex items-center gap-2"
                  style={{ backgroundColor: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                  <span>✓</span>
                  <span>No meaningful changes detected in this category.</span>
                </div>
              )}
            </>
          )}

          {/* Stable stocks */}
          {(filter === 'all' || filter === 'stable') && stable.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-3" style={{ color: '#667085' }}>
                Everything else is stable — {stable.length} {stable.length === 1 ? 'stock' : 'stocks'}
              </p>
              <div className="flex flex-wrap gap-2">
                {stable.map(d => (
                  <button key={d.symbol}
                    onClick={() => window.location.assign(`/stocks/${d.symbol}`)}
                    className="px-3 py-1.5 rounded-lg text-sm border transition-all duration-150"
                    style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.06)', color: '#9AA4B2' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                    {d.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
