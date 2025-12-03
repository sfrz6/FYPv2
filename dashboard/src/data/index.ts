import type {
  HoneypotEvent,
  TimeRange,
  Filters,
  KPISummary,
  TimeSeriesPoint,
  TopItem,
  MapPoint,
  PaginatedResponse,
  TISummary,
} from '@/types';
import { demoAdapter } from './adapters/demo';

export interface HoneypotDataAdapter {
  getSummary(range: TimeRange, filters: Filters): Promise<KPISummary>;
  getAttacksOverTime(range: TimeRange, filters: Filters): Promise<TimeSeriesPoint[]>;
  getTopPorts(range: TimeRange, filters: Filters): Promise<TopItem[]>;
  getTopIps(range: TimeRange, filters: Filters): Promise<TopItem[]>;
  getEventTypes(range: TimeRange, filters: Filters): Promise<TopItem[]>;
  getTopCountries(range: TimeRange, filters: Filters): Promise<TopItem[]>;
  getRecentEvents(
    range: TimeRange,
    filters: Filters,
    page: number,
    size: number
  ): Promise<PaginatedResponse<HoneypotEvent>>;
  getMapPoints(range: TimeRange, filters: Filters): Promise<MapPoint[]>;
  getTopSSHUsernames?(range: TimeRange, filters: Filters): Promise<TopItem[]>;
  getTopSSHPasswords?(range: TimeRange, filters: Filters): Promise<TopItem[]>;
  getTISummary?(range: TimeRange, filters: Filters): Promise<TISummary>;
}

export const adapters: Record<string, HoneypotDataAdapter> = {
  demo: demoAdapter,
};

export function getAdapter(name: string): HoneypotDataAdapter {
  return adapters[name] || adapters.demo;
}
