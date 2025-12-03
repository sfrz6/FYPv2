import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCard } from './ChartCard';
import { useRecentEvents } from '@/hooks/useHoneypotData';
import { useFilters } from '@/context/FiltersContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { getAdapter } from '@/data';
import { downloadCSV, downloadJSON } from '@/utils/export';

const COLORS = [
  'hsl(160 84% 39%)',
  'hsl(192 82% 51%)',
  'hsl(271 91% 65%)',
  'hsl(48 96% 53%)',
  'hsl(25 95% 53%)',
];

export function EventTypesDonut() {
  const { data: recent } = useRecentEvents(0, 1000);
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const [selectedSensor, setSelectedSensor] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['eventTypes-local', timeRange, filters, adapter, selectedSensor],
    queryFn: () => {
      const localFilters = selectedSensor === 'all' ? filters : { ...filters, sensors: [selectedSensor] };
      return dataAdapter.getEventTypes(timeRange, localFilters);
    },
    staleTime: 30000,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      name: item.label.replace(/_/g, ' '),
      value: item.count,
    }));
  }, [data]);

  const sensors = useMemo(() => {
    const rows = recent?.rows || [];
    const set = new Set<string>();
    rows.forEach((e) => {
      if (e.sensor) set.add(e.sensor);
    });
    return Array.from(set).sort();
  }, [recent]);

  const handleSensorChange = (value: string) => {
    setSelectedSensor(value);
  };

  if (isLoading) {
    return (
      <ChartCard title="Attack Types" description="Distribution of attack types">
        <Skeleton className="h-[300px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Attack Types"
      description="Distribution of attack event types"
      onExportCSV={() =>
        downloadCSV(
          data?.map((d) => ({ type: d.label, count: d.count })) || [],
          'attack-types.csv'
        )
      }
      onExportJSON={() => downloadJSON(data, 'attack-types.json')}
    >
      <div className="flex justify-end mb-3">
        <Select value={selectedSensor} onValueChange={handleSensorChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All sensors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sensors</SelectItem>
            {sensors.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine
            label={renderLabel}
            outerRadius={95}
            innerRadius={50}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={3}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, outerRadius, name, percent }: any) => {
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const isDark =
      typeof document !== 'undefined' && (
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.body.getAttribute('data-theme') === 'dark'
      );
    const fillColor = '#ffffff';
    return (
      <text
        x={x}
        y={y}
        fill={fillColor}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: 700 }}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
