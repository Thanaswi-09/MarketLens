import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AttentionBadge } from '../components/AttentionBadge';
import { LoadingState, EmptyState } from '../components/LoadingState';
import { useWatchlist } from '../hooks/useWatchlist';
import type { ChangeDetail } from '../types';

function fmtPct(n: number | null) {
  if (n == null) return null;
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function ChangeRow({ detail }: { detail: ChangeDetail }) {
  const navigate = useNavigate();
  const { symbol, company_name, price_change_pct, volume_change_pct, attention_score, baseline_multiplier } = detail;
  const priceUp = (price_change_pct ?? 0) >= 0;

  return (
    <div onClick={() => navigate(`/stocks/${symbol}`)}
      className="flex items-center justify-between p-4 bg-slate-800/60 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-500 hover:bg-slate-800 transition-all">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{symbol}</span>
            <AttentionBadge score={attention_score} />
          </div>
          {company_name && <p className="text-slate-400 text-xs">{company_name}</p>}
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm">
        {price_change_pct != null && (
          <div className="text-right">
            <p className={`font-semibold flex items-center gap-1 ${priceUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {priceUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {fmtPct(price_change_pct)}
            </p>
            {baseline_multiplier && baseline_multiplier > 1.5 && (
              <p className="text-yellow-400 text-xs">{baseline_multiplier.toFixed(1)}× normal</p>
            )}
          </div>
        )}
        {volume_change_pct != null && (
          <div className="text-right hidden sm:block">
            <p className="text-slate-400 text-xs">Volume</p>
            <p className={`font-medium ${(volume_change_pct ?? 0) >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              {fmtPct(volume_change_pct)}
            </p>
          </div>
        )}
        <div className="text-right hidden md:block">
          <p className="text-slate-400 text-xs">Score</p>
          <p className="text-white font-semibold">{attention_score.score}/100</p>
        </div>
      </div>
    </div>
  );
}

export function WhatChanged() {
  const { watchlists, activeId, setActiveId, summary, summaryLoading } = useWatchlist();

  const meaningful = summary ? [...summary.needs_attention, ...summary.changed] : [];
  const stable = summary?.stable ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">What Changed?</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {summary?.last_checked
            ? `Since your last check at ${new Date(summary.last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Meaningful changes since your last check'}
        </p>
      </div>

      {/* Watchlist selector */}
      <div className="flex flex-wrap gap-2">
        {watchlists.map(wl => (
          <button key={wl.id} onClick={() => setActiveId(wl.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${activeId === wl.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            {wl.name}
          </button>
        ))}
      </div>

      {summaryLoading ? (
        <LoadingState message="Analyzing changes..." />
      ) : !summary ? (
        <EmptyState title="No watchlist selected" description="Select a watchlist to see what changed." />
      ) : meaningful.length === 0 && stable.length === 0 ? (
        <EmptyState title="No stocks in watchlist" description="Add stocks from the Dashboard." />
      ) : (
        <div className="space-y-6">
          {meaningful.length > 0 ? (
            <section>
              <p className="text-slate-300 font-semibold mb-3">
                {meaningful.length} meaningful {meaningful.length === 1 ? 'change' : 'changes'}
              </p>
              <div className="space-y-3">
                {meaningful.map(d => <ChangeRow key={d.symbol} detail={d} />)}
              </div>
            </section>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
              ✓ No meaningful changes detected.
            </div>
          )}

          {stable.length > 0 && (
            <section>
              <p className="text-slate-500 text-sm font-medium mb-2">
                Everything else is stable ({stable.length} {stable.length === 1 ? 'stock' : 'stocks'})
              </p>
              <div className="flex flex-wrap gap-2">
                {stable.map(d => (
                  <span key={d.symbol} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-sm">
                    {d.symbol}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
