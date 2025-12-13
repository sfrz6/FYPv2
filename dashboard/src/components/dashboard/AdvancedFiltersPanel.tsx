import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// inline panel version to avoid popup issues
// removed calendar to avoid heavy modal rendering issues
import { useFilters } from '@/context/FiltersContext';
import { getAdapter } from '@/data';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getTimeRangeFromPreset } from '@/utils/date';

export function AdvancedFiltersPanel() {
  const { filters, setFilters, timeRange, setTimeRange, adapter } = useFilters();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sensor, setSensor] = useState<string>(filters.sensors[0] || 'all');
  const [datePreset, setDatePreset] = useState<'all'|'24h'|'7d'|'30d'|'custom'>(timeRange.preset === 'custom' ? 'custom' : (timeRange.preset as any) || '30d');
  const [fromStr, setFromStr] = useState<string>('');
  const [toStr, setToStr] = useState<string>('');
  const [eventType, setEventType] = useState<string>((filters.eventTypes && filters.eventTypes[0]) || 'all');
  const [country, setCountry] = useState<string>(filters.countries[0] || '');
  const [ip, setIp] = useState<string>(filters.ipAddress || '');
  const [username, setUsername] = useState<string>(filters.usernameQuery || '');
  const [password, setPassword] = useState<string>(filters.passwordQuery || '');

  const dataAdapter = getAdapter(adapter);
  const computedFilters = useMemo(() => ({
    ...filters,
    sensors: sensor === 'all' ? [] : [sensor],
  }), [filters, sensor]);
  const { data: eventTypeList, isLoading: typesLoading } = useQuery({
    queryKey: ['adv-event-types', timeRange, computedFilters, adapter],
    queryFn: () => dataAdapter.getEventTypes(timeRange, computedFilters),
    staleTime: 30000,
    enabled: true,
  });

  const apply = () => {
    const newFilters = { ...filters };
    newFilters.sensors = sensor === 'all' ? [] : [sensor];
    newFilters.eventTypes = eventType === 'all' ? [] : [eventType];
    newFilters.countries = country ? [country] : [];
    newFilters.ipAddress = ip || undefined;
    newFilters.usernameQuery = username || undefined;
    newFilters.passwordQuery = password || undefined;
    setFilters(newFilters);

    if (datePreset === 'custom' && fromStr && toStr) {
      const from = new Date(fromStr);
      const to = new Date(toStr);
      setTimeRange({ from: from.toISOString(), to: to.toISOString(), preset: 'custom' });
    } else {
      setTimeRange(getTimeRangeFromPreset(datePreset as any));
    }
    setOpen(false);
  };

  const handleReport = () => {
    navigate('/report', { state: { fromAdvanced: true } });
  };

  return (
    <div className="rounded-lg border p-4 bg-card">
      {!open && (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>Show Advanced Filters</Button>
      )}
      {open && (
        <div className="rounded-md border p-3 mt-2">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Sensor</label>
              <select className="w-full h-9 rounded-md border bg-background px-2" value={sensor} onChange={(e) => setSensor(e.target.value)}>
                <option value="all">All</option>
                <option value="cowrie">Cowrie</option>
                <option value="dionaea">Dionaea</option>
                <option value="opencanary">OpenCanary</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Date range</label>
              <select className="w-full h-9 rounded-md border bg-background px-2" value={datePreset} onChange={(e) => setDatePreset(e.target.value as any)}>
                <option value="all">All time</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
              {datePreset === 'custom' && (
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Input type="datetime-local" value={fromStr} onChange={(e) => setFromStr(e.target.value)} />
                  <Input type="datetime-local" value={toStr} onChange={(e) => setToStr(e.target.value)} />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Event type</label>
              <select className="w-full h-9 rounded-md border bg-background px-2" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                <option value="all">All</option>
                {typesLoading && <option value="" disabled>Loading…</option>}
                {!typesLoading && (eventTypeList || []).length === 0 && <option value="" disabled>No attack types</option>}
                {!typesLoading && (eventTypeList || []).map((it) => (
                  <option key={it.label} value={it.label.toLowerCase()}>{it.label}</option>
                ))}
              </select>
            </div>

            

            <div>
              <label className="text-xs text-muted-foreground">Country (ISO2)</label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., OM" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Source IP Address</label>
              <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="e.g., 192.168.1.10" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Username contains</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., admin" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Password contains</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="e.g., 1234" />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button type="button" onClick={apply}>Apply Filters</Button>
            <Button type="button" variant="secondary" onClick={handleReport}>Generate Report from Results</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Hide Filters</Button>
          </div>
        </div>
      )}
    </div>
  );
}
