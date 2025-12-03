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
import { useTopCountries } from '@/hooks/useHoneypotData';
import { useFilters } from '@/context/FiltersContext';
import { downloadCSV, downloadJSON } from '@/utils/export';

export function TopCountries() {
  const { data, isLoading } = useTopCountries();
  const { filters, setFilters } = useFilters();

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.slice(0, 10).map((item) => ({
      country: item.label,
      count: item.count,
    }));
  }, [data]);

  const handleBarClick = (data: any) => {
    const country = data.country;
    if (!filters.countries.includes(country)) {
      setFilters({ ...filters, countries: [...filters.countries, country] });
    }
  };

  if (isLoading) {
    return (
      <ChartCard title="Top Countries" description="Attack origin countries">
        <Skeleton className="h-[300px] w-full" />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Top Countries"
      description="Countries with most attack traffic"
      onExportCSV={() => downloadCSV(chartData, 'top-countries.csv')}
      onExportJSON={() => downloadJSON(chartData, 'top-countries.json')}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="country"
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
          <Bar
            dataKey="count"
            fill="hsl(var(--accent))"
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`hsl(271 ${91 - index * 5}% ${65 - index * 3}%)`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
