import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

interface PriceChartProps {
  data: { time: string; price: number }[];
}

interface VolumeChartProps {
  data: { time: string; volume: number }[];
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function fmtVol(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

export function PriceChart({ data }: PriceChartProps) {
  if (!data.length) return <div className="h-40 flex items-center justify-center text-slate-500 text-sm">No price history</div>;

  const first = data[0]?.price ?? 0;
  const last = data[data.length - 1]?.price ?? 0;
  const up = last >= first;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={up ? '#34d399' : '#f87171'} stopOpacity={0.3} />
            <stop offset="95%" stopColor={up ? '#34d399' : '#f87171'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="time" tickFormatter={fmtTime} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={50} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          labelFormatter={(label: unknown) => fmtTime(String(label))}
          formatter={(v: unknown) => [`$${Number(v).toFixed(2)}`, 'Price']}
        />
        <Area type="monotone" dataKey="price" stroke={up ? '#34d399' : '#f87171'} strokeWidth={2} fill="url(#priceGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (!data.length) return <div className="h-32 flex items-center justify-center text-slate-500 text-sm">No volume history</div>;

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="time" tickFormatter={fmtTime} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={fmtVol} width={40} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          labelFormatter={(label: unknown) => fmtTime(String(label))}
          formatter={(v: unknown) => [fmtVol(Number(v)), 'Volume']}
        />
        <Bar dataKey="volume" fill="#3b82f6" opacity={0.7} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
