import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdapter } from '@/data';
import type { TimeRange, Filters } from '@/types';
import { useFilters } from '@/context/FiltersContext';

export function useSummary() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['summary', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getSummary(timeRange, filters),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any;
      if (prev && prev.totalAttempts === incoming.totalAttempts && prev.totalAttacks === incoming.totalAttacks && prev.uniqueIps === incoming.uniqueIps) {
        return prev;
      }
      return incoming;
    },
  });
}

export function useAttacksOverTime() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['attacksOverTime', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getAttacksOverTime(timeRange, filters),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any[] | undefined;
      if (prev && incoming && prev.length === incoming.length) {
        const lp = prev[prev.length - 1];
        const li = incoming[incoming.length - 1];
        if (lp && li && lp.ts === li.ts && lp.count === li.count) return prev;
      }
      return incoming;
    },
  });
}

export function useAttacksOverTimeWithRange(customRange: TimeRange) {
  const { filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['attacksOverTimeLocal', customRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getAttacksOverTime(customRange, filters),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any[] | undefined;
      if (prev && incoming && prev.length === incoming.length) {
        const lp = prev[prev.length - 1];
        const li = incoming[incoming.length - 1];
        if (lp && li && lp.ts === li.ts && lp.count === li.count) return prev;
      }
      return incoming;
    },
  });
}

export function useTopPorts() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['topPorts', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getTopPorts(timeRange, filters),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any[] | undefined;
      if (prev && incoming && prev.length === incoming.length) return prev;
      return incoming;
    },
  });
}

export function useTopIps() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['topIps', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getTopIps(timeRange, filters),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any[] | undefined;
      if (prev && incoming && prev.length === incoming.length) return prev;
      return incoming;
    },
  });
}

export function useEventTypes() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['eventTypes', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getEventTypes(timeRange, filters),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any[] | undefined;
      if (prev && incoming && prev.length === incoming.length) return prev;
      return incoming;
    },
  });
}

export function useTopCountries() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['topCountries', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getTopCountries(timeRange, filters),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any[] | undefined;
      if (prev && incoming && prev.length === incoming.length) return prev;
      return incoming;
    },
  });
}

export function useRecentEvents(page: number = 0, pageSize: number = 20) {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['recentEvents', timeRange, filters, page, pageSize, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getRecentEvents(timeRange, filters, page, pageSize),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any;
      if (prev && incoming) {
        if (prev.total === incoming.total && prev.rows?.[0]?.id === incoming.rows?.[0]?.id) return prev;
      }
      return incoming;
    },
  });
}

export function useMapPoints() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['mapPoints', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getMapPoints(timeRange, filters),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any[] | undefined;
      if (prev && incoming && prev.length === incoming.length) {
        const sumPrev = prev.reduce((s, p) => s + (p.count || 0), 0);
        const sumIncoming = incoming.reduce((s, p) => s + (p.count || 0), 0);
        if (sumPrev === sumIncoming) return prev;
      }
      return incoming;
    },
  });
}

export function useTopSSHUsernames() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['topSSHUsernames', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getTopSSHUsernames?.(timeRange, filters) || Promise.resolve([]),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    enabled: !!dataAdapter.getTopSSHUsernames,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any[] | undefined;
      if (prev && incoming && prev.length === incoming.length) return prev;
      return incoming;
    },
  });
}

export function useTopSSHPasswords() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['topSSHPasswords', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getTopSSHPasswords?.(timeRange, filters) || Promise.resolve([]),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    enabled: !!dataAdapter.getTopSSHPasswords,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any[] | undefined;
      if (prev && incoming && prev.length === incoming.length) return prev;
      return incoming;
    },
  });
}

export function useTISummary() {
  const { timeRange, filters, adapter, autoRefresh } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const queryClient = useQueryClient();
  const key = ['tiSummary', timeRange, filters, adapter];

  return useQuery({
    queryKey: key,
    queryFn: () => dataAdapter.getTISummary?.(timeRange, filters) || Promise.resolve({
      maliciousIps: 0,
      avgVTDetections: 0,
      topMalwareFamilies: [],
      topMaliciousIps: [],
    }),
    staleTime: 30000,
    refetchInterval: autoRefresh === 'on' ? 15000 : false,
    refetchOnWindowFocus: false,
    enabled: !!dataAdapter.getTISummary,
    select: (incoming) => {
      const prev = queryClient.getQueryData(key) as any;
      if (prev && incoming && prev.maliciousIps === incoming.maliciousIps && prev.avgVTDetections === incoming.avgVTDetections) return prev;
      return incoming;
    },
  });
}
