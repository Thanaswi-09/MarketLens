import type { WatchlistChangeSummary } from '../types';

export function ChangeSummary({ summary }: { summary: WatchlistChangeSummary }) {
  const { needs_attention, changed, stable, last_checked } = summary;

  const lastCheckedStr = last_checked
    ? new Date(last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const metrics = [
    { count: needs_attention.length, label: 'Needs Attention', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
    { count: changed.length,         label: 'Changed',         color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    { count: stable.length,          label: 'Stable',          color: '#22C55E', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {metrics.map(m => (
        <div key={m.label} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border"
          style={{ backgroundColor: m.bg, borderColor: m.border }}>
          <span className="text-xl font-bold tabular-nums" style={{ color: m.color }}>{m.count}</span>
          <span className="text-sm" style={{ color: '#9AA4B2' }}>{m.label}</span>
        </div>
      ))}
      {lastCheckedStr && (
        <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: '#667085' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22C55E', boxShadow: '0 0 4px #22C55E' }} />
          Last checked {lastCheckedStr}
        </div>
      )}
    </div>
  );
}
