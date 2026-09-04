import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { PriceChart, VolumeChart } from '../components/StockChart';
import { AttentionBadge, AttentionScoreBar } from '../components/AttentionBadge';
import { DataStatusBadge } from '../components/DataStatusBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { useStock } from '../hooks/useStock';

function fmt(n: number | null | undefined, prefix = '') {
  if (n == null) return '—';
  return `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtLarge(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtVol(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}

export function StockDetails() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { detail, loading, error } = useStock(symbol ?? null);

  if (loading) return <LoadingState message={`Loading ${symbol}...`} />;
  if (error || !detail) return <ErrorState message={error ?? 'Stock not found'} onRetry={() => window.location.reload()} />;

  const { quote, attention_score, price_history, volume_history } = detail;
  const priceUp = (quote.change_percent ?? 0) >= 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-white">{quote.symbol}</h1>
            {attention_score && <AttentionBadge score={attention_score} />}
          </div>
          {quote.company_name && <p className="text-slate-400 mt-1">{quote.company_name}</p>}
          <DataStatusBadge status={quote.data_status} timestamp={quote.timestamp} />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{fmt(quote.price, '$')}</p>
          {quote.change_percent != null && (
            <p className={`flex items-center justify-end gap-1 font-semibold ${priceUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {priceUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {priceUp ? '+' : ''}{quote.change_percent.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Day High" value={fmt(quote.day_high, '$')} />
        <StatBox label="Day Low" value={fmt(quote.day_low, '$')} />
        <StatBox label="Volume" value={fmtVol(quote.volume)} />
        <StatBox label="Market Cap" value={fmtLarge(quote.market_cap)} />
        <StatBox label="52W High" value={fmt(quote.week52_high, '$')} />
        <StatBox label="52W Low" value={fmt(quote.week52_low, '$')} />
        <StatBox label="Avg Volume" value={fmtVol(quote.avg_volume)} />
        <StatBox label="Data Source" value={quote.data_source} />
      </div>

      {/* Charts */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-4">
        <h2 className="text-white font-semibold">Price History</h2>
        <PriceChart data={price_history} />
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-4">
        <h2 className="text-white font-semibold">Volume History</h2>
        <VolumeChart data={volume_history} />
      </div>

      {/* Attention score */}
      {attention_score && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-4">
          <h2 className="text-white font-semibold">Attention Score</h2>
          <AttentionScoreBar score={attention_score} />
          <p className="text-slate-300 text-sm italic">{attention_score.summary}</p>

          {attention_score.breakdown.length > 0 && (
            <div className="space-y-2">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Why this score?</p>
              {attention_score.breakdown.map(b => (
                <div key={b.factor} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{b.factor}</p>
                    <p className="text-slate-400 text-xs">{b.description}</p>
                  </div>
                  <span className="text-blue-400 font-semibold text-sm">+{b.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
