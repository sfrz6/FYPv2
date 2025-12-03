import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChartCard } from './ChartCard';
import { EventDetailsDrawer } from './EventDetailsDrawer';
import { useRecentEvents } from '@/hooks/useHoneypotData';
import { useFilters } from '@/context/FiltersContext';
import { getAdapter } from '@/data';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/utils/date';
import { downloadCSV } from '@/utils/export';
import { HoneypotEvent } from '@/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function RecentEventsTable() {
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<HoneypotEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const global = useRecentEvents(page, 20);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  const localRange = useMemo(() => {
    if (from && to) return { from: new Date(from).toISOString(), to: new Date(to).toISOString() };
    return timeRange;
  }, [from, to, timeRange]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['recentEvents-local', localRange, filters, query, page, 20, adapter],
    queryFn: () => {
      const localFilters = { ...filters, query };
      return dataAdapter.getRecentEvents(localRange, localFilters, page, 20);
    },
    staleTime: 30000,
    keepPreviousData: true,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(queryInput);
    setPage(0);
  };

  const filteredRows = data?.rows || [];

  const handleRowClick = (event: HoneypotEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

if (!data && isLoading) {
  return (
    <ChartCard title="Recent Events">
      <Skeleton className="h-[400px] w-full" />
    </ChartCard>
  );
}

  return (
    <ChartCard
      title="Recent Events"
      description={`Showing ${data?.rows.length || 0} of ${data?.total || 0} events`}
      onExportCSV={() => downloadCSV(data?.rows || [], 'recent-events.csv')}
    >
      <form onSubmit={handleSearchSubmit} className="mb-3 space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by sensor, sourceIP, protocol, event type, attackID, country"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">From</span>
            <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">To</span>
            <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary">Apply</Button>
        </div>
      </form>
      <div className="rounded-md border relative">
        {isFetching && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="text-xs text-muted-foreground">Updating…</span>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Sensor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source IP</TableHead>
              <TableHead>Protocol</TableHead>
              <TableHead>Port</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Attack ID</TableHead>
              <TableHead>Country</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((event) => (
              <TableRow 
                key={event.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(event)}
              >
                <TableCell className="font-mono text-xs">{formatDateTime(event.timestamp)}</TableCell>
                <TableCell className="font-mono text-xs">{event.sensor}</TableCell>
                <TableCell><Badge variant="outline">{event.sensor_type}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{event.src_ip}</TableCell>
                <TableCell><Badge variant="secondary">{event.protocol}</Badge></TableCell>
                <TableCell className="font-mono">{event.dst_port}</TableCell>
                <TableCell className="font-mono text-xs">{event.event_type}</TableCell>
                <TableCell className="font-mono text-xs">{event.original_id || 'N/A'}</TableCell>
                <TableCell><Badge>{event.geoip?.country_iso_code || 'N/A'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <Button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {page + 1} • Showing {filteredRows.length} / {data?.rows.length || 0}</span>
        <Button disabled={(page + 1) * 20 >= (data?.total || 0)} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
      <EventDetailsDrawer
        event={selectedEvent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </ChartCard>
  );
}
