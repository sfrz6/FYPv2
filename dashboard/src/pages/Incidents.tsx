import { useMemo } from 'react';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { useRecentEvents } from '@/hooks/useHoneypotData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, User, KeyRound, Clock } from 'lucide-react';

export default function Incidents() {
  const { data: events, isLoading: loadingEvents } = useRecentEvents(0, 5000);

  // Calculate heatmap data: hour of day × protocol
  const heatmapData = useMemo(() => {
    if (!events?.rows) return [];

    const matrix: Record<number, Record<string, number>> = {};
    
    events.rows.forEach((event) => {
      const hour = new Date(event.timestamp).getHours();
      if (!matrix[hour]) matrix[hour] = {};
      matrix[hour][event.protocol] = (matrix[hour][event.protocol] || 0) + 1;
    });

    // Get all unique protocols
    const protocols = Array.from(
      new Set(events.rows.map((e) => e.protocol))
    ).sort();

    return Array.from({ length: 24 }, (_, hour) => {
      const row: any = { hour: `${hour}:00` };
      protocols.forEach((protocol) => {
        row[protocol] = matrix[hour]?.[protocol] || 0;
      });
      return row;
    });
  }, [events]);

  const protocols = useMemo(() => {
    if (!events?.rows) return [];
    return Array.from(new Set(events.rows.map((e) => e.protocol))).sort();
  }, [events]);

  const protocolColors = {
    ssh: 'hsl(var(--primary))',
    http: 'hsl(var(--accent))',
    ftp: 'hsl(var(--chart-2))',
    smb: 'hsl(var(--chart-3))',
  };

  const cowrieSSHUsernames = useMemo(() => {
    const counts = new Map<string, number>();
    (events?.rows || [])
      .filter((e) => e.sensor_type === 'cowrie' && (e.protocol === 'ssh' || e.event_type === 'ssh_bruteforce'))
      .forEach((e) => {
        const u = e.ssh?.username;
        if (u) counts.set(u, (counts.get(u) || 0) + 1);
      });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const cowrieSSHPasswords = useMemo(() => {
    const counts = new Map<string, number>();
    (events?.rows || [])
      .filter((e) => e.sensor_type === 'cowrie' && (e.protocol === 'ssh' || e.event_type === 'ssh_bruteforce'))
      .forEach((e) => {
        const p = e.ssh?.password;
        if (p) counts.set(p, (counts.get(p) || 0) + 1);
      });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const httpUsernames = useMemo(() => {
    const counts = new Map<string, number>();
    (events?.rows || [])
      .filter((e) => e.sensor_type === 'opencanary' && (e.protocol === 'http' || e.protocol === 'https'))
      .forEach((e) => {
        const u = e.auth?.username;
        if (u) counts.set(u, (counts.get(u) || 0) + 1);
      });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const httpPasswords = useMemo(() => {
    const counts = new Map<string, number>();
    (events?.rows || [])
      .filter((e) => e.sensor_type === 'opencanary' && (e.protocol === 'http' || e.protocol === 'https'))
      .forEach((e) => {
        const p = e.auth?.password;
        if (p) counts.set(p, (counts.get(p) || 0) + 1);
      });
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Incident Deep Dive
        </h1>
        <p className="text-muted-foreground">
          Analyze attack patterns, credentials, and temporal distributions
        </p>
      </div>

      {/* SSH Credentials Row (Cowrie only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top SSH Usernames"
          description="Most attempted usernames in SSH attacks"
          icon={User}
        >
          {loadingEvents ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cowrieSSHUsernames} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {cowrieSSHUsernames?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Top SSH Passwords"
          description="Most attempted passwords in SSH attacks"
          icon={KeyRound}
        >
          {loadingEvents ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cowrieSSHPasswords} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {cowrieSSHPasswords?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--accent))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* HTTP/S Credentials Row (OpenCanary only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top HTTP/HTTPS Usernames"
          description="Most attempted usernames in HTTP/HTTPS attacks"
          icon={User}
        >
          {loadingEvents ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={httpUsernames} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="label" stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {httpUsernames?.map((_, index) => (
                    <Cell key={`cell-http-u-${index}`} fill="hsl(var(--chart-2))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Top HTTP/HTTPS Passwords"
          description="Most attempted passwords in HTTP/HTTPS attacks"
          icon={KeyRound}
        >
          {loadingEvents ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={httpPasswords} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="label" stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {httpPasswords?.map((_, index) => (
                    <Cell key={`cell-http-p-${index}`} fill="hsl(var(--chart-3))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Temporal Heatmap */}
      <ChartCard
        title="Attack Distribution Heatmap"
        description="Hour of day × Protocol correlation"
        icon={Clock}
      >
        {loadingEvents ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={heatmapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              {protocols.map((protocol, idx) => (
                <Bar
                  key={protocol}
                  dataKey={protocol}
                  stackId="a"
                  fill={(protocolColors as any)[protocol] || `hsl(var(--chart-${idx + 1}))`}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
