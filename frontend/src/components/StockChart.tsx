import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function fmtVol(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

const tooltipStyle = {
  contentStyle: {
    background: '#1A222D',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontSize: 12,
    color: '#F5F7FA',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  itemStyle: { color: '#9AA4B2' },
  labelStyle: { color: '#F5F7FA', fontWeight: 600, marginBottom: 4 },
};

interface PriceChartProps {
  data: { time: string; price: number }[];
}

interface VolumeChartProps {
  data: { time: string; volume: number }[];
  avgVolume?: number | null;
}

export function PriceChart({ data }: PriceChartProps) {
  if (!data.length) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2 rounded-lg"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <span className="text-2xl">📈</span>
        <p className="text-sm" style={{ color: '#667085' }}>No price history yet</p>
        <p className="text-xs" style={{ color: '#667085' }}>Data will appear after multiple checks</p>
      </div>
    );
  }

  const first = data[0]?.price ?? 0;
  const last = data[data.length - 1]?.price ?? 0;
  const up = last >= first;
  const color = up ? '#22C55E' : '#EF4444';
  const gradId = `priceGrad_${up ? 'up' : 'dn'}`;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="time" tickFormatter={fmtTime}
          tick={{ fontSize: 10, fill: '#667085' }} tickLine={false} axisLine={false}
          interval="preserveStartEnd" />
        <YAxis domain={['auto', 'auto']}
          tick={{ fontSize: 10, fill: '#667085' }} tickLine={false} axisLine={false}
          tickFormatter={v => `$${v}`} width={56} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(l: unknown) => fmtTime(String(l))}
          formatter={(v: unknown) => [`$${Number(v).toFixed(2)}`, 'Price']}
        />
        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2}
          fill={`url(#${gradId})`} dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart({ data, avgVolume }: VolumeChartProps) {
  if (!data.length) {
    return (
      <div className="h-32 flex items-center justify-center rounded-lg"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <p className="text-sm" style={{ color: '#667085' }}>No volume history</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="time" tickFormatter={fmtTime}
          tick={{ fontSize: 10, fill: '#667085' }} tickLine={false} axisLine={false}
          interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: '#667085' }} tickLine={false} axisLine={false}
          tickFormatter={fmtVol} width={40} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(l: unknown) => fmtTime(String(l))}
          formatter={(v: unknown) => {
            const vol = Number(v);
            const pct = avgVolume && avgVolume > 0 ? ` (${((vol / avgVolume - 1) * 100).toFixed(0)}% vs avg)` : '';
            return [`${fmtVol(vol)}${pct}`, 'Volume'];
          }}
        />
        <Bar dataKey="volume" radius={[3, 3, 0, 0]} fill="#38BDF8" opacity={0.6} />
      </BarChart>
    </ResponsiveContainer>
  );
}
