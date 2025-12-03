import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCard } from './ChartCard';
import { useTopPorts } from '@/hooks/useHoneypotData';
import { useFilters } from '@/context/FiltersContext';
import { downloadCSV, downloadJSON } from '@/utils/export';

export function TopPorts() {
  const { data, isLoading } = useTopPorts();
  const { filters, setFilters } = useFilters();

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      port: item.label,
      count: item.count,
    }));
  }, [data]);

  const handleBarClick = (data: any) => {
    const port = data.port;
    // In real implementation, would need to map port to protocol
    console.log('Clicked port:', port);
  };

  if (isLoading) {
    return (
      <ChartCard title="Top Target Ports" description="Most targeted ports">
        <Skeleton className="h-[300px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Top Target Ports"
      description="Most frequently targeted ports"
      onExportCSV={() => downloadCSV(chartData, 'top-ports.csv')}
      onExportJSON={() => downloadJSON(chartData, 'top-ports.json')}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis
            dataKey="port"
            type="category"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar
            dataKey="count"
            fill="hsl(var(--primary))"
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`hsl(160 ${84 - index * 5}% ${39 + index * 3}%)`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
