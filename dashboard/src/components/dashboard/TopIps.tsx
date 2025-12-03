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
import { useTopIps } from '@/hooks/useHoneypotData';
import { downloadCSV, downloadJSON } from '@/utils/export';

export function TopIps() {
  const { data, isLoading } = useTopIps();

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      ip: item.label,
      count: item.count,
    }));
  }, [data]);

  const handleBarClick = (data: any) => {
    console.log('Clicked IP:', data.ip);
    // Could open drill-down drawer here
  };

  if (isLoading) {
    return (
      <ChartCard title="Top Source IPs" description="Most active attackers">
        <Skeleton className="h-[300px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Top Source IPs"
      description="Most active source IP addresses"
      onExportCSV={() => downloadCSV(chartData, 'top-ips.csv')}
      onExportJSON={() => downloadJSON(chartData, 'top-ips.json')}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="ip"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar
            dataKey="count"
            fill="hsl(var(--secondary))"
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`hsl(192 ${82 - index * 5}% ${51 - index * 2}%)`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
