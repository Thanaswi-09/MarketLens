type Status = 'FRESH' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';

const statusCfg: Record<Status, { label: string; color: string; dot: string; show: boolean }> = {
  FRESH:       { label: 'Live',        color: '#22C55E', dot: '#22C55E', show: true },
  DELAYED:     { label: 'Delayed',     color: '#F59E0B', dot: '#F59E0B', show: true },
  STALE:       { label: 'Stale',       color: '#F97316', dot: '#F97316', show: true },
  UNAVAILABLE: { label: 'Unavailable', color: '#EF4444', dot: '#EF4444', show: true },
};

interface Props {
  status: Status;
  timestamp?: string | null;
  showFresh?: boolean;
}

export function DataStatusBadge({ status, timestamp, showFresh = false }: Props) {
  const cfg = statusCfg[status] ?? statusCfg.UNAVAILABLE;
  if (status === 'FRESH' && !showFresh) return null;

  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot, boxShadow: status === 'FRESH' ? `0 0 4px ${cfg.dot}` : 'none' }} />
      <span style={{ color: cfg.color }}>{cfg.label}</span>
      {timeStr && status !== 'FRESH' && (
        <span style={{ color: '#667085' }}>· {timeStr}</span>
      )}
    </div>
  );
}

export function DataStatusBanner({ status, timestamp }: { status: Status; timestamp?: string | null }) {
  if (status === 'FRESH') return null;
  const cfg = statusCfg[status];
  const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  const messages: Record<string, string> = {
    DELAYED: `Market data is delayed.${timeStr ? ` Last updated ${timeStr}.` : ''}`,
    STALE: `Market data is stale.${timeStr ? ` Last verified at ${timeStr}.` : ''} Showing last known snapshot.`,
    UNAVAILABLE: `Live market data is temporarily unavailable.${timeStr ? ` Showing last verified snapshot from ${timeStr}.` : ''}`,
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs border"
      style={{ backgroundColor: `${cfg.dot}10`, borderColor: `${cfg.dot}25`, color: cfg.color }}>
      <span>⚠</span>
      <span>{messages[status]}</span>
    </div>
  );
}
