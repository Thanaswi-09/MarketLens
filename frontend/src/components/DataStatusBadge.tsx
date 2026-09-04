type Status = 'FRESH' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';

const statusConfig: Record<Status, { label: string; color: string }> = {
  FRESH: { label: 'Live', color: 'text-emerald-400' },
  DELAYED: { label: 'Delayed', color: 'text-yellow-400' },
  STALE: { label: 'Stale', color: 'text-orange-400' },
  UNAVAILABLE: { label: 'Unavailable', color: 'text-red-400' },
};

export function DataStatusBadge({ status, timestamp }: { status: Status; timestamp?: string | null }) {
  const cfg = statusConfig[status] ?? statusConfig.UNAVAILABLE;
  const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  if (status === 'FRESH') return null;

  return (
    <div className={`flex items-center gap-1 text-xs ${cfg.color}`}>
      <span>⚠</span>
      <span>Data {cfg.label.toLowerCase()}{timeStr ? ` · Last updated ${timeStr}` : ''}</span>
    </div>
  );
}
