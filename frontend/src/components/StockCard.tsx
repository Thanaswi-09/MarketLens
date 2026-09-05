import { useNavigate } from 'react-router-dom';
import { Trash2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { AttentionBadge, AttentionScoreBar } from './AttentionBadge';
import { DataStatusBadge } from './DataStatusBadge';
import type { ChangeDetail } from '../types';

function fmt(n: number | null, prefix = '') {
  if (n == null) return '—';
  return `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number | null) {
  if (n == null) return null;
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
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
  const isAttention = attention_score.classification === 'NEEDS_ATTENTION';
  const pricePct = fmtPct(price_change_pct);
  const volPct = fmtPct(volume_change_pct);
  const priceUp = (price_change_pct ?? 0) >= 0;

  const borderColor = isAttention
    ? 'rgba(239,68,68,0.2)'
    : isStable
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(245,158,11,0.15)';

  return (
    <div
      onClick={() => navigate(`/stocks/${symbol}`)}
      className="group relative rounded-xl p-4 cursor-pointer border transition-all duration-200"
      style={{
        backgroundColor: '#151B23',
        borderColor,
        opacity: isStable ? 0.75 : 1,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '#1A222D';
        (e.currentTarget as HTMLElement).style.borderColor = isAttention ? 'rgba(239,68,68,0.4)' : isStable ? 'rgba(255,255,255,0.08)' : 'rgba(245,158,11,0.3)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '#151B23';
        (e.currentTarget as HTMLElement).style.borderColor = borderColor;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}>
          <Trash2 className="w-3 h-3" style={{ color: '#EF4444' }} />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pr-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base font-bold tracking-tight" style={{ color: '#F5F7FA' }}>{symbol}</span>
            <AttentionBadge score={attention_score} />
          </div>
          {company_name && (
            <p className="text-xs truncate max-w-[160px]" style={{ color: '#667085' }}>{company_name}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-base font-bold tabular-nums" style={{ color: '#F5F7FA' }}>{fmt(current_price, '$')}</p>
          {pricePct && (
            <p className="text-xs font-semibold flex items-center justify-end gap-0.5 tabular-nums"
              style={{ color: priceUp ? '#22C55E' : '#EF4444' }}>
              {priceUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {pricePct}
            </p>
          )}
        </div>
      </div>

      {/* Since last check */}
      {!isStable && (
        <div className="mb-3 p-2.5 rounded-lg space-y-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: '#667085' }}>Since your last check</p>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#9AA4B2' }}>Price</span>
            <span className="font-medium tabular-nums" style={{ color: priceUp ? '#22C55E' : '#EF4444' }}>{pricePct ?? '—'}</span>
          </div>
          {volume_change_pct != null && (
            <div className="flex justify-between text-xs">
              <span style={{ color: '#9AA4B2' }}>Volume</span>
              <span className="font-medium tabular-nums" style={{ color: (volume_change_pct ?? 0) >= 0 ? '#38BDF8' : '#F97316' }}>{volPct}</span>
            </div>
          )}
          {baseline_multiplier && baseline_multiplier > 1.5 && (
            <p className="text-xs font-medium" style={{ color: '#F59E0B' }}>
              {baseline_multiplier.toFixed(1)}× its normal movement
            </p>
          )}
        </div>
      )}

      {/* Score bar */}
      {!compact && <div className="mb-3"><AttentionScoreBar score={attention_score} /></div>}

      {/* Summary */}
      {!isStable && attention_score.summary && (
        <p className="text-xs line-clamp-2 mb-2" style={{ color: '#9AA4B2' }}>{attention_score.summary}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <DataStatusBadge status={data_status} timestamp={current_snapshot_time} />
        <span className="text-xs flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: '#38BDF8' }}>
          Details <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
