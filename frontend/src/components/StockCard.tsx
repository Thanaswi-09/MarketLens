import { useNavigate } from 'react-router-dom';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { AttentionBadge, AttentionScoreBar } from './AttentionBadge';
import { DataStatusBadge } from './DataStatusBadge';
import type { ChangeDetail } from '../types';

function fmt(n: number | null, prefix = '') {
  if (n == null) return '—';
  return `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number | null) {
  if (n == null) return null;
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

interface Props {
  detail: ChangeDetail;
  onRemove?: () => void;
  compact?: boolean;
}

export function StockCard({ detail, onRemove, compact }: Props) {
  const navigate = useNavigate();
  const { symbol, company_name, current_price, price_change_pct, volume_change_pct,
    attention_score, data_status, current_snapshot_time, baseline_multiplier } = detail;

  const isStable = attention_score.classification === 'STABLE';
  const pricePct = fmtPct(price_change_pct);
  const volPct = fmtPct(volume_change_pct);
  const priceUp = (price_change_pct ?? 0) >= 0;

  return (
    <div
      onClick={() => navigate(`/stocks/${symbol}`)}
      className={`group relative bg-slate-800/60 border rounded-xl p-4 cursor-pointer transition-all hover:border-slate-500 hover:bg-slate-800 ${
        isStable ? 'border-slate-700/50 opacity-80' : 'border-slate-700'
      }`}
    >
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
        </button>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">{symbol}</span>
            <AttentionBadge score={attention_score} />
          </div>
          {company_name && <p className="text-slate-400 text-xs mt-0.5 truncate max-w-[180px]">{company_name}</p>}
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">{fmt(current_price, '$')}</p>
          {pricePct && (
            <p className={`text-sm font-medium flex items-center justify-end gap-1 ${priceUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {priceUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {pricePct}
            </p>
          )}
        </div>
      </div>

      {!isStable && (
        <div className="mb-3 p-2.5 bg-slate-900/50 rounded-lg space-y-1">
          <p className="text-slate-400 text-xs font-medium mb-1.5">Since your last check</p>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Price</span>
            <span className={pricePct ? (priceUp ? 'text-emerald-400' : 'text-red-400') : 'text-slate-400'}>
              {pricePct ?? '—'}
            </span>
          </div>
          {volume_change_pct != null && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Volume</span>
              <span className={(volume_change_pct ?? 0) >= 0 ? 'text-blue-400' : 'text-orange-400'}>{volPct}</span>
            </div>
          )}
          {baseline_multiplier && baseline_multiplier > 1.5 && (
            <p className="text-xs text-yellow-400 mt-1">{baseline_multiplier.toFixed(1)}× its normal movement</p>
          )}
        </div>
      )}

      {!compact && (
        <div className="mb-3">
          <AttentionScoreBar score={attention_score} />
        </div>
      )}

      {!isStable && attention_score.breakdown.length > 0 && (
        <p className="text-xs text-slate-400 italic line-clamp-2">{attention_score.summary}</p>
      )}

      <div className="mt-2">
        <DataStatusBadge status={data_status} timestamp={current_snapshot_time} />
      </div>
    </div>
  );
}
