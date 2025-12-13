import type { TimePreset, TimeRange } from '@/types';

export function getTimeRangeFromPreset(preset: TimePreset): TimeRange {
  const now = new Date();
  const to = now.toISOString();
  let from: string;

  switch (preset) {
    case 'all':
      from = '1970-01-01T00:00:00.000Z';
      break;
    case '15m':
      from = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
      break;
    case '1h':
      from = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      break;
    case '24h':
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      break;
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '14d':
      from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    default:
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  return { from, to, preset };
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

export function formatDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString();
}

export function formatTimeShort(isoString: string): string {
  return new Date(isoString).toLocaleTimeString();
}

export function getRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}
