import { useState } from 'react';
import { Clock, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFilters } from '@/context/FiltersContext';
import { getTimeRangeFromPreset } from '@/utils/date';
import type { TimePreset, AutoRefreshInterval } from '@/types';

const timePresets: { value: TimePreset; label: string }[] = [
  { value: '15m', label: 'Last 15m' },
  { value: '1h', label: 'Last 1h' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7d' },
  { value: '14d', label: 'Last 14d' },
  { value: '30d', label: 'Last 30d' },
];

const refreshIntervals: { value: AutoRefreshInterval; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'on', label: 'On' },
];

export function TopBar() {
  const { timeRange, setTimeRange, filters, setFilters, autoRefresh, setAutoRefresh } =
    useFilters();
  const [searchQuery, setSearchQuery] = useState(filters.query || '');

  const handleTimePresetChange = (preset: TimePreset) => {
    setTimeRange(getTimeRangeFromPreset(preset));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, query: searchQuery });
  };

  const removeFilter = (type: 'sensor' | 'protocol' | 'country', value: string) => {
    if (type === 'sensor') {
      setFilters({ ...filters, sensors: filters.sensors.filter((s) => s !== value) });
    } else if (type === 'protocol') {
      setFilters({ ...filters, protocols: filters.protocols.filter((p) => p !== value) });
    } else {
      setFilters({ ...filters, countries: filters.countries.filter((c) => c !== value) });
    }
  };

  const clearAllFilters = () => {
    setFilters({ sensors: [], protocols: [], countries: [], query: '' });
    setSearchQuery('');
  };

  const hasFilters =
    filters.sensors.length > 0 ||
    filters.protocols.length > 0 ||
    filters.countries.length > 0 ||
    filters.query;

  return (
    <div className="border-b border-border bg-card">
      <div className="p-4 flex flex-wrap items-center gap-4">
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Select
            value={timeRange.preset || '30d'}
            onValueChange={(value) => handleTimePresetChange(value as TimePreset)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timePresets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-refresh */}
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <Select value={autoRefresh} onValueChange={(val) => setAutoRefresh(val as AutoRefreshInterval)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {refreshIntervals.map((interval) => (
                <SelectItem key={interval.value} value={interval.value}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search IPs, URLs, usernames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <Button variant="secondary" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {filters.sensors.map((sensor) => (
            <Badge key={sensor} variant="secondary" className="gap-2">
              Sensor: {sensor}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('sensor', sensor)}
              />
            </Badge>
          ))}
          {filters.protocols.map((protocol) => (
            <Badge key={protocol} variant="secondary" className="gap-2">
              Protocol: {protocol}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('protocol', protocol)}
              />
            </Badge>
          ))}
          {filters.countries.map((country) => (
            <Badge key={country} variant="secondary" className="gap-2">
              Country: {country}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('country', country)}
              />
            </Badge>
          ))}
          {filters.query && (
            <Badge variant="secondary" className="gap-2">
              Query: {filters.query}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setFilters({ ...filters, query: '' });
                  setSearchQuery('');
                }}
              />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
