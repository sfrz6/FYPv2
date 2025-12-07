import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { useAttacksOverTimeWithRange } from '@/hooks/useHoneypotData';
import { downloadCSV, downloadJSON } from '@/utils/export';
import { getTimeRangeFromPreset } from '@/utils/date';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';

export function AttacksTrend() {
  const [preset, setPreset] = useState<'15m' | '1h' | '24h' | '7d' | '14d' | '30d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');

  const computeCustomRange = (): { from: string; to: string; preset: 'custom' } => {
    const fromDate = dateRange.from ? new Date(dateRange.from) : new Date();
    const toDate = dateRange.to ? new Date(dateRange.to) : dateRange.from ? new Date(dateRange.from) : new Date();
    const [sh, sm] = startTime.split(':').map((v) => parseInt(v || '0', 10));
    const [eh, em] = endTime.split(':').map((v) => parseInt(v || '0', 10));
    fromDate.setHours(sh || 0, sm || 0, 0, 0);
    toDate.setHours(eh || 23, em || 59, 59, 999);
    return { from: fromDate.toISOString(), to: toDate.toISOString(), preset: 'custom' };
  };

  const localRange = preset === 'custom' ? computeCustomRange() : getTimeRangeFromPreset(preset as any);
  const { data, isLoading } = useAttacksOverTimeWithRange(localRange);

  const chartData = useMemo(() => {
    if (!data) return [];
    const isLongRange = preset === '7d' || preset === '14d' || preset === '30d' || preset === 'custom';
    return data.map((point) => {
      const d = new Date(point.ts);
      const timestamp = isLongRange
        ? d.toLocaleDateString([], { month: 'short', day: '2-digit' })
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        timestamp,
        total: point.count,
        ...point.bySensor,
      };
    });
  }, [data, preset]);

  const sensors = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sensorSet = new Set<string>();
    data.forEach((point) => {
      if (point.bySensor) {
        Object.keys(point.bySensor).forEach((sensor) => sensorSet.add(sensor));
      }
    });
    return Array.from(sensorSet);
  }, [data]);

  const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

  

  if (isLoading && (!data || data.length === 0)) {
    return (
      <ChartCard title="Attacks Over Time" description="Time series of attack events by sensor">
        <div className="h-[300px] w-full bg-muted animate-pulse" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Attacks Over Time"
      description="Time series of attack events by sensor"
      onExportCSV={() => downloadCSV(chartData, 'attacks-over-time.csv')}
      onExportJSON={() => downloadJSON(chartData, 'attacks-over-time.json')}
    >
      <div className="flex justify-between items-center mb-2 gap-4 flex-wrap">
        <Select
          value={preset}
          onValueChange={(val) => setPreset(val as any)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15m">Last 15 minutes</SelectItem>
            <SelectItem value="1h">Last 1 hour</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
        {preset === 'custom' && (
          <div className="flex items-start gap-4 w-full">
            <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
            <div className="grid grid-cols-1 gap-2 w-48">
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            {sensors.map((sensor, idx) => (
              <linearGradient key={sensor} id={`color${sensor}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="timestamp"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          {sensors.map((sensor, idx) => (
            <Area
              key={sensor}
              type="monotone"
              dataKey={sensor}
              stroke={colors[idx % colors.length]}
              fill={`url(#color${sensor})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
