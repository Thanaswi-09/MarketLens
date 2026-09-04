import type { WatchlistChangeSummary } from '../types';

export function ChangeSummary({ summary }: { summary: WatchlistChangeSummary }) {
  const { needs_attention, changed, stable, last_checked, data_freshness } = summary;

  const lastCheckedStr = last_checked
    ? new Date(last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span className="text-red-400 font-semibold text-sm">{needs_attention.length}</span>
        <span className="text-slate-400 text-sm">need attention</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <span className="text-yellow-400 font-semibold text-sm">{changed.length}</span>
        <span className="text-slate-400 text-sm">changed</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-emerald-400 font-semibold text-sm">{stable.length}</span>
        <span className="text-slate-400 text-sm">stable</span>
      </div>
      {lastCheckedStr && (
        <span className="text-slate-500 text-xs ml-auto">Last checked {lastCheckedStr}</span>
      )}
      {data_freshness !== 'FRESH' && (
        <span className={`text-xs ${data_freshness === 'UNAVAILABLE' ? 'text-red-400' : data_freshness === 'STALE' ? 'text-orange-400' : 'text-yellow-400'}`}>
          ⚠ Data {data_freshness.toLowerCase()}
        </span>
      )}
    </div>
  );
}
