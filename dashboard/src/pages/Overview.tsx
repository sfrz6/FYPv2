import { Activity, MapPin, Server, Globe } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { AttacksTrend } from '@/components/dashboard/AttacksTrend';
import { TopPorts } from '@/components/dashboard/TopPorts';
import { TopIps } from '@/components/dashboard/TopIps';
import { EventTypesDonut } from '@/components/dashboard/EventTypesDonut';
import { TopCountries } from '@/components/dashboard/TopCountries';
import { RecentEventsTable } from '@/components/dashboard/RecentEventsTable';
import { WorldMap } from '@/components/map/WorldMap';
import { useSummary, useAttacksOverTime } from '@/hooks/useHoneypotData';
import { useMemo } from 'react';
import { AttacksTell } from '@/components/dashboard/AttacksTell';
import { AdvancedFiltersPanel } from '@/components/dashboard/AdvancedFiltersPanel';

export default function Overview() {
  const { data, isLoading } = useSummary();
  const { data: timeSeriesData } = useAttacksOverTime();

  const sparklineData = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return [];
    return timeSeriesData.slice(-10).map((point) => ({ value: point.count }));
  }, [timeSeriesData]);

  return (
    <div className="space-y-6">
      <AdvancedFiltersPanel />
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Total Attacks" 
          value={data?.totalAttacks || 0} 
          icon={Activity} 
          loading={isLoading} 
          sparklineData={sparklineData}
        />
        <KpiCard 
          title="Unique Source IPs" 
          value={data?.uniqueIps || 0} 
          icon={MapPin} 
          loading={isLoading}
          sparklineData={sparklineData}
        />
        <KpiCard 
          title="Total Attempts" 
          value={data?.totalAttempts || 0} 
          icon={Server} 
          loading={isLoading}
          sparklineData={sparklineData}
        />
        <KpiCard 
          title="Countries Involved" 
          value={data?.uniqueCountries || 0} 
          icon={Globe} 
          loading={isLoading}
          sparklineData={sparklineData}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AttacksTrend />
        <EventTypesDonut />
      </div>

      <AttacksTell limit={6} />

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TopPorts />
        <TopIps />
        <TopCountries />
      </div>

      {/* World Map */}
      <WorldMap />

      {/* Recent Events */}
      <RecentEventsTable />
    </div>
  );
}
