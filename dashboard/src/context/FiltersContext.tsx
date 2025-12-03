import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { TimeRange, Filters, AutoRefreshInterval, Theme, Direction } from '@/types';
import { getTimeRangeFromPreset } from '@/utils/date';

interface FiltersContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  autoRefresh: AutoRefreshInterval;
  setAutoRefresh: (interval: AutoRefreshInterval) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  direction: Direction;
  setDirection: (dir: Direction) => void;
  adapter: string;
  setAdapter: (adapter: string) => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export function FiltersProvider({ children }: { children: ReactNode }) {
  // Load from localStorage or defaults
  const [timeRange, setTimeRangeState] = useState<TimeRange>(() => {
    const saved = localStorage.getItem('timeRange');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getTimeRangeFromPreset('30d');
      }
    }
    return getTimeRangeFromPreset('30d');
  });

  const [filters, setFiltersState] = useState<Filters>(() => {
    const saved = localStorage.getItem('filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { sensors: [], protocols: [], countries: [], query: '' } as Filters;
      }
    }
    return { sensors: [], protocols: [], countries: [], query: '' } as Filters;
  });

  const [autoRefresh, setAutoRefreshState] = useState<AutoRefreshInterval>('off');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [direction, setDirectionState] = useState<Direction>('ltr');
  const [adapter, setAdapterState] = useState<string>('demo');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('timeRange', JSON.stringify(timeRange));
  }, [timeRange]);


  useEffect(() => {
    localStorage.setItem('filters', JSON.stringify(filters));
  }, [filters]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Apply direction to document
  useEffect(() => {
    document.documentElement.dir = direction;
  }, [direction]);

  // Auto-refresh logic handled by individual hooks via React Query polling.
  // We deliberately avoid shifting the time window here to prevent unnecessary re-renders.
  useEffect(() => {
    return;
  }, [autoRefresh]);

  const setTimeRange = (range: TimeRange) => {
    setTimeRangeState(range);
    // Update URL params
    const params = new URLSearchParams(window.location.search);
    if (range.preset) {
      params.set('timePreset', range.preset);
    } else {
      params.set('from', range.from);
      params.set('to', range.to);
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  };

  const setFilters = (newFilters: Filters) => {
    setFiltersState(newFilters);
    // Update URL params
    const params = new URLSearchParams(window.location.search);
    if (newFilters.sensors.length > 0) {
      params.set('sensors', newFilters.sensors.join(','));
    } else {
      params.delete('sensors');
    }
    if (newFilters.protocols.length > 0) {
      params.set('protocols', newFilters.protocols.join(','));
    } else {
      params.delete('protocols');
    }
    if (newFilters.countries.length > 0) {
      params.set('countries', newFilters.countries.join(','));
    } else {
      params.delete('countries');
    }
    if (newFilters.eventTypes && newFilters.eventTypes.length > 0) {
      params.set('eventTypes', newFilters.eventTypes.join(','));
    } else {
      params.delete('eventTypes');
    }
    if (newFilters.usernameQuery) {
      params.set('user', newFilters.usernameQuery);
    } else {
      params.delete('user');
    }
    if (newFilters.passwordQuery) {
      params.set('pass', newFilters.passwordQuery);
    } else {
      params.delete('pass');
    }
    if (newFilters.ipAddress) {
      params.set('ip', newFilters.ipAddress);
    } else {
      params.delete('ip');
    }
    // Backwards-compat: preserved when present
    if (newFilters.credentialsQuery) {
      params.set('creds', newFilters.credentialsQuery);
    } else {
      params.delete('creds');
    }
    if (newFilters.query) {
      params.set('query', newFilters.query);
    } else {
      params.delete('query');
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  };

  return (
    <FiltersContext.Provider
      value={{
        timeRange,
        setTimeRange,
        filters,
        setFilters,
        autoRefresh,
        setAutoRefresh: setAutoRefreshState,
        theme,
        setTheme: setThemeState,
        direction,
        setDirection: setDirectionState,
        adapter,
        setAdapter: setAdapterState,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within FiltersProvider');
  }
  return context;
}
