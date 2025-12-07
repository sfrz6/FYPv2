export type HoneypotEvent = {
  id: string;
  timestamp: string; // ISO
  sensor: string;
  sensor_type: 'cowrie' | 'dionaea' | 'opencanary' | string;
  src_ip: string;
  dst_port: number;
  protocol: 'ssh' | 'http' | 'ftp' | 'smb' | string;
  event_type:
    | 'ssh_login_attempt'
    | 'http_probe'
    | 'ftp_connection'
    | 'malware_download'
    | string;
  geoip?: {
    country_iso_code?: string;
    city_name?: string;
    location?: { lat: number; lon: number };
    asn?: string;
    asn_org?: string;
  };
  ssh?: { username?: string; password?: string };
  http?: { url?: string };
  auth?: { username?: string; password?: string; result?: string };
  command?: { raw?: string; category?: string };
  attack?: string;
  raw?: Record<string, unknown>;
  original_id?: string;
  ti?: {
    abuseipdb?: { score: number };
    virustotal?: { reputation: number; detections: number };
    malwarebazaar?: { family?: string; hash?: string; last_seen?: string };
    mitre?: Array<{ tactic: string; technique: string; id?: string }>;
  };
};

export type TimePreset = '15m' | '1h' | '24h' | '7d' | '14d' | '30d' | 'custom';

export type TimeRange = {
  from: string;
  to: string;
  preset?: TimePreset;
};

export type Filters = {
  sensors: string[];
  protocols: string[];
  countries: string[];
  eventTypes?: string[];
  ipAddress?: string;
  usernameQuery?: string;
  passwordQuery?: string;
  credentialsQuery?: string;
  query?: string;
};

export type KPISummary = {
  totalAttacks: number;
  totalAttempts: number;
  uniqueIps: number;
  uniqueSensors: number;
  uniqueCountries: number;
};

export type TimeSeriesPoint = {
  ts: string;
  count: number;
  bySensor?: Record<string, number>;
};

export type TopItem = {
  label: string;
  count: number;
};

export type MapPoint = {
  lat: number;
  lon: number;
  count: number;
  country?: string;
};

export type PaginatedResponse<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AutoRefreshInterval = 'off' | 'on';

export type Theme = 'dark' | 'light';

export type Direction = 'ltr' | 'rtl';

export type TISummary = {
  maliciousIps: number;
  avgVTDetections: number;
  topMalwareFamilies: Array<{ family: string; count: number }>;
  topMaliciousIps: Array<{
    ip: string;
    count: number;
    abuseScore?: number;
    vtDetections?: number;
    malwareFamily?: string;
    mitreTactics?: string[];
  }>;
  topUploads?: Array<{ hash: string; url?: string; detections?: number; count: number }>;
};

export type SensorStatus = 'healthy' | 'idle' | 'down';
