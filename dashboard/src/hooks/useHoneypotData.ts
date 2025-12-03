import { useQuery } from '@tanstack/react-query';
import { getAdapter } from '@/data';
import type { TimeRange, Filters } from '@/types';
import { useFilters } from '@/context/FiltersContext';

export function useSummary() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['summary', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getSummary(timeRange, filters),
    staleTime: 30000,
  });
}

export function useAttacksOverTime() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['attacksOverTime', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getAttacksOverTime(timeRange, filters),
    staleTime: 30000,
  });
}

export function useAttacksOverTimeWithRange(customRange: TimeRange) {
  const { filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['attacksOverTimeLocal', customRange, filters, adapter],
    queryFn: () => dataAdapter.getAttacksOverTime(customRange, filters),
    staleTime: 30000,
  });
}

export function useTopPorts() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['topPorts', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getTopPorts(timeRange, filters),
    staleTime: 30000,
  });
}

export function useTopIps() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['topIps', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getTopIps(timeRange, filters),
    staleTime: 30000,
  });
}

export function useEventTypes() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['eventTypes', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getEventTypes(timeRange, filters),
    staleTime: 30000,
  });
}

export function useTopCountries() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['topCountries', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getTopCountries(timeRange, filters),
    staleTime: 30000,
  });
}

export function useRecentEvents(page: number = 0, pageSize: number = 20) {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['recentEvents', timeRange, filters, page, pageSize, adapter],
    queryFn: () => dataAdapter.getRecentEvents(timeRange, filters, page, pageSize),
    staleTime: 30000,
  });
}

export function useMapPoints() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['mapPoints', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getMapPoints(timeRange, filters),
    staleTime: 30000,
  });
}

export function useTopSSHUsernames() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['topSSHUsernames', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getTopSSHUsernames?.(timeRange, filters) || Promise.resolve([]),
    staleTime: 30000,
    enabled: !!dataAdapter.getTopSSHUsernames,
  });
}

export function useTopSSHPasswords() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['topSSHPasswords', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getTopSSHPasswords?.(timeRange, filters) || Promise.resolve([]),
    staleTime: 30000,
    enabled: !!dataAdapter.getTopSSHPasswords,
  });
}

export function useTISummary() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);

  return useQuery({
    queryKey: ['tiSummary', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getTISummary?.(timeRange, filters) || Promise.resolve({
      maliciousIps: 0,
      avgVTDetections: 0,
      topMalwareFamilies: [],
      topMaliciousIps: [],
    }),
    staleTime: 30000,
    enabled: !!dataAdapter.getTISummary,
  });
}
