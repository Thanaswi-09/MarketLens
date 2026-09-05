import type { AttentionScore } from '../types';

const cfg = {
  NEEDS_ATTENTION: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#EF4444', dot: '#EF4444', label: 'NEEDS ATTENTION' },
  CHANGED:         { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: '#F59E0B', dot: '#F59E0B', label: 'CHANGED' },
  STABLE:          { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',   text: '#22C55E', dot: '#22C55E', label: 'STABLE' },
};

export function AttentionBadge({ score }: { score: AttentionScore }) {
  const c = cfg[score.classification];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border"
      style={{ background: c.bg, borderColor: c.border, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
}

export function AttentionScoreRing({ score }: { score: AttentionScore }) {
  const c = cfg[score.classification];
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score.score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={c.dot} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color: '#F5F7FA' }}>{Math.round(score.score)}</span>
          <span className="text-xs" style={{ color: '#667085' }}>/100</span>
        </div>
      </div>
      <AttentionBadge score={score} />
    </div>
  );
}

export function AttentionScoreBar({ score }: { score: AttentionScore }) {
  const c = cfg[score.classification];
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color: '#9AA4B2' }}>Attention Score</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: '#F5F7FA' }}>{Math.round(score.score)}<span style={{ color: '#667085' }}>/100</span></span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score.score}%`, backgroundColor: c.dot }} />
      </div>
    </div>
  );
}
