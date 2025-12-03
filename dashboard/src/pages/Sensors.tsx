import { useMemo } from 'react';
import { useSummary, useRecentEvents, useTopPorts, useEventTypes } from '@/hooks/useHoneypotData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getRelativeTime } from '@/utils/date';
import { useFilters } from '@/context/FiltersContext';
import { useNavigate } from 'react-router-dom';

export default function Sensors() {
  const { data: summary } = useSummary();
  const { data: events, isLoading } = useRecentEvents(0, 1000);
  const { filters, setFilters } = useFilters();
  const navigate = useNavigate();

  const sensorStats = useMemo(() => {
    if (!events?.rows) return [];

    const statsMap = new Map<
      string,
      {
        sensor: string;
        totalEvents: number;
        lastSeen: string;
        topPorts: Array<{ port: number; count: number }>;
        topEventType: string;
        timeline: Array<{ ts: string; count: number }>;
      }
    >();

    // Group events by sensor
    events.rows.forEach((event) => {
      if (!statsMap.has(event.sensor)) {
        statsMap.set(event.sensor, {
          sensor: event.sensor,
          totalEvents: 0,
          lastSeen: event.timestamp,
          topPorts: [],
          topEventType: '',
          timeline: [],
        });
      }

      const stats = statsMap.get(event.sensor)!;
      stats.totalEvents++;
      
      // Update last seen if newer
      if (new Date(event.timestamp) > new Date(stats.lastSeen)) {
        stats.lastSeen = event.timestamp;
      }
    });

    // Calculate top ports and event types per sensor
    statsMap.forEach((stats, sensor) => {
      const sensorEvents = events.rows.filter((e) => e.sensor === sensor);

      // Top 3 ports
      const portCounts = new Map<number, number>();
      sensorEvents.forEach((e) => {
        portCounts.set(e.dst_port, (portCounts.get(e.dst_port) || 0) + 1);
      });
      stats.topPorts = Array.from(portCounts.entries())
        .map(([port, count]) => ({ port, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Top event type
      const eventTypeCounts = new Map<string, number>();
      sensorEvents.forEach((e) => {
        eventTypeCounts.set(e.event_type, (eventTypeCounts.get(e.event_type) || 0) + 1);
      });
      const topEventType = Array.from(eventTypeCounts.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0];
      stats.topEventType = topEventType?.[0] || 'N/A';

      // Timeline (last 20 data points)
      const timeline = new Map<string, number>();
      sensorEvents.slice(0, 20).forEach((e) => {
        const bucket = new Date(e.timestamp).toISOString().slice(0, 16); // Minute precision
        timeline.set(bucket, (timeline.get(bucket) || 0) + 1);
      });
      stats.timeline = Array.from(timeline.entries())
        .map(([ts, count]) => ({ ts, count }))
        .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalEvents - a.totalEvents);
  }, [events]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          Sensor Health & Status
        </h1>
        <p className="text-muted-foreground">
          Monitor deployed honeypot sensors and their activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sensorStats.map((sensor) => {
          const isOnline = new Date().getTime() - new Date(sensor.lastSeen).getTime() < 5 * 60 * 1000;
          
          return (
            <Card
              key={sensor.sensor}
              className="overflow-hidden cursor-pointer"
              onClick={() => {
                setFilters({ ...filters, sensors: [sensor.sensor] });
                navigate('/');
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {sensor.sensor}
                    </CardTitle>
                  </div>
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isOnline ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
                    }`}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sparkline */}
                <div className="h-16 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensor.timeline}>
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Events</span>
                    <span className="font-semibold text-foreground">{sensor.totalEvents}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Top Event Type</span>
                    <span className="font-mono text-xs text-foreground">{sensor.topEventType}</span>
                  </div>
                  <div className="text-sm">
                    <div className="text-muted-foreground mb-1">Top Ports</div>
                    <div className="flex gap-2">
                      {sensor.topPorts.map((p) => (
                        <span
                          key={p.port}
                          className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-mono"
                        >
                          {p.port}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
