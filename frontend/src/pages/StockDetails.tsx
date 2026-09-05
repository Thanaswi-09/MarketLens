import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { PriceChart, VolumeChart } from '../components/StockChart';
import { AttentionBadge, AttentionScoreRing } from '../components/AttentionBadge';
import { DataStatusBadge, DataStatusBanner } from '../components/DataStatusBadge';
import { SkeletonChart, SkeletonMetric, ErrorState } from '../components/LoadingState';
import { useStock } from '../hooks/useStock';

function fmt(n: number | null | undefined, prefix = '') {
  if (n == null) return '—';
  return `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtLarge(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtVol(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-3.5 border" style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="text-xs mb-1.5" style={{ color: '#667085' }}>{label}</p>
      <p className="text-sm font-bold tabular-nums" style={{ color: '#F5F7FA' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#9AA4B2' }}>{sub}</p>}
    </div>
  );
}

export function StockDetails() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { detail, loading, error } = useStock(symbol ?? null);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="skeleton h-4 w-16" />
      <div className="skeleton h-10 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => <SkeletonMetric key={i} />)}
      </div>
      <SkeletonChart />
      <SkeletonChart />
    </div>
  );

  if (error || !detail) return <ErrorState message={error ?? 'Stock not found'} onRetry={() => window.location.reload()} />;

  const { quote, attention_score, price_history, volume_history } = detail;
  const priceUp = (quote.change_percent ?? 0) >= 0;

  // Dynamic growth over displayed history
  const histFirst = price_history[0]?.price;
  const histLast = price_history[price_history.length - 1]?.price;
  const histGrowth = histFirst && histLast && histFirst > 0
    ? ((histLast - histFirst) / histFirst) * 100
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm transition-colors duration-150"
        style={{ color: '#667085' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#F5F7FA')}
        onMouseLeave={e => (e.currentTarget.style.color = '#667085')}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Data freshness banner */}
      {quote.data_status !== 'FRESH' && (
        <DataStatusBanner status={quote.data_status} timestamp={quote.timestamp} />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#F5F7FA' }}>{quote.symbol}</h1>
            {attention_score && <AttentionBadge score={attention_score} />}
          </div>
          {quote.company_name && (
            <p className="text-base mb-2" style={{ color: '#9AA4B2' }}>{quote.company_name}</p>
          )}
          <DataStatusBadge status={quote.data_status} timestamp={quote.timestamp} showFresh />
        </div>

        <div className="text-right">
          <p className="text-4xl font-bold tabular-nums" style={{ color: '#F5F7FA' }}>{fmt(quote.price, '$')}</p>
          {quote.change_percent != null && (
            <p className="flex items-center justify-end gap-1 text-lg font-semibold tabular-nums mt-1"
              style={{ color: priceUp ? '#22C55E' : '#EF4444' }}>
              {priceUp ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {priceUp ? '+' : ''}{quote.change_percent.toFixed(2)}%
            </p>
          )}
          {histGrowth != null && (
            <p className="text-xs mt-1" style={{ color: '#667085' }}>
              {histGrowth >= 0 ? '+' : ''}{histGrowth.toFixed(2)}% over history
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Day High"   value={fmt(quote.day_high, '$')} />
        <StatCard label="Day Low"    value={fmt(quote.day_low, '$')} />
        <StatCard label="Volume"     value={fmtVol(quote.volume)} />
        <StatCard label="Market Cap" value={fmtLarge(quote.market_cap)} />
        <StatCard label="52W High"   value={fmt(quote.week52_high, '$')} />
        <StatCard label="52W Low"    value={fmt(quote.week52_low, '$')} />
        <StatCard label="Avg Volume" value={fmtVol(quote.avg_volume)} />
        <StatCard label="Data Source" value={quote.data_source} />
      </div>

      {/* Price chart */}
      <div className="rounded-xl p-5 border" style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>Price History</h2>
          {histGrowth != null && (
            <span className="text-xs font-semibold tabular-nums px-2 py-1 rounded-lg"
              style={{
                backgroundColor: histGrowth >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: histGrowth >= 0 ? '#22C55E' : '#EF4444',
              }}>
              {histGrowth >= 0 ? '+' : ''}{histGrowth.toFixed(2)}%
            </span>
          )}
        </div>
        <PriceChart data={price_history} />
      </div>

      {/* Volume chart */}
      <div className="rounded-xl p-5 border" style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>Volume</h2>
          {quote.avg_volume && quote.volume && (
            <div className="text-right">
              <p className="text-xs" style={{ color: '#667085' }}>vs avg</p>
              <p className="text-xs font-semibold tabular-nums"
                style={{ color: quote.volume > quote.avg_volume * 1.5 ? '#38BDF8' : '#9AA4B2' }}>
                {quote.volume > quote.avg_volume
                  ? `+${(((quote.volume / quote.avg_volume) - 1) * 100).toFixed(0)}%`
                  : `${(((quote.volume / quote.avg_volume) - 1) * 100).toFixed(0)}%`}
              </p>
            </div>
          )}
        </div>
        <VolumeChart data={volume_history} avgVolume={quote.avg_volume} />
      </div>

      {/* Attention score + breakdown */}
      {attention_score && (
        <div className="rounded-xl p-5 border" style={{ backgroundColor: '#151B23', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-sm font-semibold" style={{ color: '#F5F7FA' }}>Attention Score</h2>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 cursor-help" style={{ color: '#667085' }} />
              <div className="absolute left-5 top-0 z-10 w-56 p-2.5 rounded-lg text-xs border hidden group-hover:block"
                style={{ backgroundColor: '#1A222D', borderColor: 'rgba(255,255,255,0.08)', color: '#9AA4B2' }}>
                Measures how unusual and significant the stock's recent movement is. 0 = stable, 100 = high attention.
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <AttentionScoreRing score={attention_score} />

            <div className="flex-1 w-full space-y-1">
              <p className="text-sm italic mb-3" style={{ color: '#9AA4B2' }}>{attention_score.summary}</p>
              {attention_score.breakdown.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#667085' }}>Why this score?</p>
                  {attention_score.breakdown.map(b => (
                    <div key={b.factor} className="flex items-center justify-between py-2.5 border-b last:border-0"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#F5F7FA' }}>{b.factor}</p>
                        <p className="text-xs" style={{ color: '#9AA4B2' }}>{b.description}</p>
                      </div>
                      <span className="text-sm font-bold tabular-nums ml-4" style={{ color: '#38BDF8' }}>+{b.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
