import type { AttentionScore } from '../types';

const config = {
  NEEDS_ATTENTION: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400', label: 'NEEDS ATTENTION' },
  CHANGED: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-400', label: 'CHANGED' },
  STABLE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400', label: 'STABLE' },
};

export function AttentionBadge({ score }: { score: AttentionScore }) {
  const c = config[score.classification];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export function AttentionScoreBar({ score }: { score: AttentionScore }) {
  const pct = score.score;
  const color = score.classification === 'NEEDS_ATTENTION' ? 'bg-red-400' : score.classification === 'CHANGED' ? 'bg-yellow-400' : 'bg-emerald-400';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Attention Score</span>
        <span className="font-semibold text-white">{pct}/100</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
