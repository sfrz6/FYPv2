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
import { generateHoneypotEvents } from '../generator';

type RawHoneypotRecord = {
  id?: string;
  attack_id?: string;
  doc_type?: string;
  timestamp?: string;
  sensor?: string;
  sensor_type?: string;
  src_ip?: string;
  dst_port?: number | string;
  protocol?: string;
  event_type?: string;
  start_time?: string;
  end_time?: string;
  total_attempts?: number;
  total_login_attempts?: number;
  total_commands?: number;
  session_id?: string;
  attack_types?: string[];
  mitre?: { ids?: string[]; names?: string[] };
  events?: Array<{
    timestamp?: string;
    eventid: string;
    username?: string;
    password?: string;
    session_id?: string;
    command?: string;
    input?: string;
    url?: string;
    shasum?: string;
    sha256?: string;
    attack_types?: string[];
  }>;
  raw_events?: Array<{
    timestamp?: string;
    eventid: string;
    username?: string;
    password?: string;
    session_id?: string;
    command?: string;
    input?: string;
    url?: string;
    shasum?: string;
    sha256?: string;
    attack_types?: string[];
  }>;
  downloads?: Array<{
    url?: string;
    shasum?: string;
    sha256?: string;
    virustotal?: {
      malicious?: number;
      suspicious?: number;
      undetected?: number;
      harmless?: number;
      timeout?: number;
    };
  }>;
  geoip?: {
    country?: string;
    country_iso_code?: string;
    city?: string;
    city_name?: string;
    location?: { lat: number; lon: number };
    lat?: number;
    lon?: number;
    asn?: string;
    asn_org?: string;
  };
  attempts?: Array<{
    timestamp: string;
    event_type: string;
    username?: string;
    password?: string;
    path?: string;
    hostname?: string;
    useragent?: string;
  }>;
  ssh?: { username?: string; password?: string };
  http?: { url?: string; path?: string; hostname?: string; useragent?: string };
  abuseipdb?: { abuseConfidenceScore?: number };
  raw?: Record<string, any>;
  auth?: { username?: string; password?: string; result?: string };
  command?: { raw?: string; category?: string };
  attack?: string;
};

const ndjsonModules = import.meta.glob('../honypots/*.ndjson', {
  as: 'raw',
  eager: true,
}) as Record<string, string>;
const ndjsonSources = Object.values(ndjsonModules);

const ISO3_TO_2: Record<string, string> = {
  USA: 'US', GBR: 'GB', DEU: 'DE', FRA: 'FR', CHN: 'CN', RUS: 'RU', IND: 'IN', ARE: 'AE', SAU: 'SA', EGY: 'EG', IRQ: 'IQ', TUR: 'TR', OMN: 'OM',
};

const NAME_TO_ISO2: Record<string, string> = {
  'united states': 'US', 'united states of america': 'US', usa: 'US', 'united kingdom': 'GB', uk: 'GB', germany: 'DE', france: 'FR', china: 'CN', russia: 'RU', india: 'IN', 'united arab emirates': 'AE', 'saudi arabia': 'SA', egypt: 'EG', iraq: 'IQ', turkey: 'TR', oman: 'OM',
};

function normalizeIso2(iso?: string, name?: string): string | undefined {
  if (iso) {
    const up = iso.toUpperCase();
    if (up.length === 2) return up;
    if (up.length === 3 && ISO3_TO_2[up]) return ISO3_TO_2[up];
  }
  if (name) {
    const key = name.trim().toLowerCase();
    if (NAME_TO_ISO2[key]) return NAME_TO_ISO2[key];
  }
  return iso ? iso.toUpperCase() : undefined;
}

function normalizeFilterCountry(c: string): string {
  const up = c.toUpperCase();
  if (up.length === 2) return up;
  if (up.length === 3 && ISO3_TO_2[up]) return ISO3_TO_2[up];
  const key = c.trim().toLowerCase();
  return NAME_TO_ISO2[key] || up;
}

function isPrivateIp(ip?: string): boolean {
  if (!ip) return false;
  // IPv4 RFC1918 ranges
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

function parseNdjson(raw: string): RawHoneypotRecord[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as RawHoneypotRecord;
      } catch (error) {
        console.warn('Skipping invalid NDJSON line', { line, error });
        return null;
      }
    })
    .filter((record): record is RawHoneypotRecord => Boolean(record));
}

function normalizeTimestamp(value?: string): string {
  if (!value) return new Date().toISOString();

  const hasTimezone = value.includes('Z') || value.match(/[+-]\d{2}:?\d{2}$/);
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const withZone = hasTimezone ? normalized : `${normalized}Z`;

  const parsed = new Date(withZone);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  // Last resort fallback to now to avoid invalid dates bubbling up
  return new Date().toISOString();
}

function mapGeo(geo?: RawHoneypotRecord['geoip']): HoneypotEvent['geoip'] | undefined {
  if (!geo) return undefined;

  const location =
    geo.location && typeof geo.location.lat === 'number' && typeof geo.location.lon === 'number'
      ? geo.location
      : typeof geo.lat === 'number' && typeof geo.lon === 'number'
        ? { lat: geo.lat, lon: geo.lon }
        : undefined;

  if (
    !geo.country &&
    !geo.country_iso_code &&
    !geo.city &&
    !geo.city_name &&
    !location &&
    !geo.asn &&
    !geo.asn_org
  ) {
    return undefined;
  }

  const iso2 = normalizeIso2(geo.country_iso_code, geo.country);
  return {
    country_iso_code: iso2 || geo.country_iso_code || geo.country,
    city_name: geo.city_name || geo.city,
    location,
    asn: geo.asn,
    asn_org: geo.asn_org,
  };
}

function mapHttp(record: RawHoneypotRecord): HoneypotEvent['http'] {
  const host =
    record.http?.hostname ||
    (record.raw as any)?.dst_host ||
    (record.raw as any)?.logdata?.HOSTNAME;
  const path = record.http?.path || (record.raw as any)?.logdata?.PATH;
  const directUrl = record.http?.url;

  const inferredProtocol =
    record.protocol === 'https' || (record.raw as any)?.dst_port === 443 ? 'https' : 'http';
  const baseUrl = host
    ? host.startsWith('http')
      ? host
      : `${inferredProtocol}://${host}`
    : undefined;

  const url = directUrl || (baseUrl ? `${baseUrl}${path || ''}` : undefined);

  return url ? { url } : undefined;
}

function mapThreatIntel(record: RawHoneypotRecord): HoneypotEvent['ti'] | undefined {
  const score = record.abuseipdb?.abuseConfidenceScore;
  if (score === undefined || score === null) return undefined;

  return {
    abuseipdb: { score: Number(score) || 0 },
  };
}

function toHoneypotEvent(record: RawHoneypotRecord, index: number): HoneypotEvent {
  const timestamp = normalizeTimestamp(record.timestamp);
  const baseId = record.id ? String(record.id) : `evt-${index}`;
  const protocol = record.protocol ? record.protocol.toLowerCase() : 'unknown';

  return {
    id: `${baseId}-${index}`,
    original_id: record.id,
    timestamp,
    sensor: record.sensor || 'unknown',
    sensor_type: record.sensor_type || 'unknown',
    src_ip: record.src_ip || 'unknown',
    dst_port: Number(record.dst_port) || 0,
    protocol,
    event_type: record.event_type || (record.raw as any)?.eventid || 'unknown',
    geoip: mapGeo(record.geoip),
    ssh: record.ssh ? { username: record.ssh.username, password: record.ssh.password } : undefined,
    http: mapHttp(record),
    ti: mapThreatIntel(record),
    raw: record.raw,
    auth: record.auth,
    command: record.command,
    attack: record.attack,
  };
}

function attemptsToEvents(record: RawHoneypotRecord, index: number): HoneypotEvent[] {
  // special handling for cowrie sessions aggregated attacks
  const isCowrieBF = (record.doc_type === 'bruteforce_campaign') ||
    (record.attack_id?.startsWith('bf-'));
  if (isCowrieBF) {
    const allEvents = [
      ...(record.events || []),
      ...(record.raw_events || []),
    ].filter((ev) => ev && ev.eventid !== 'cowrie.session.closed');

    if (allEvents.length > 0) {
      const attackId = record.attack_id || record.id || `bf-${index}`;
      const portNum = 22;
      const attemptsCount = Number(record.total_login_attempts) || allEvents.length;
      if (attemptsCount > 0) attackAttemptCounts.set(String(attackId), attemptsCount);

      return allEvents.map((ev, i) => {
        const ts = normalizeTimestamp(ev.timestamp || record.start_time || record.timestamp);
        return {
          id: `${attackId}-${index}-${i}`,
          original_id: String(attackId),
          timestamp: ts,
          sensor: record.sensor || 'cowrie',
          sensor_type: 'cowrie',
          src_ip: record.src_ip || 'unknown',
          dst_port: portNum,
          protocol: 'ssh',
          event_type: 'ssh_bruteforce',
          geoip: mapGeo(record.geoip),
          ssh: ev.username || ev.password ? { username: ev.username, password: ev.password } : undefined,
          http: undefined,
          ti: {
            abuseipdb: mapThreatIntel(record)?.abuseipdb,
            mitre: [
              { tactic: 'Credential Access', technique: 'Brute Force' },
            ],
          },
          raw: record.raw,
          auth: undefined,
          command: ev.command ? { raw: ev.command, category: 'ssh' } : undefined,
          attack: 'ssh bruteforce',
        };
      });
    }
    return [cowrieSessionToEvent(record, index)];
  }

  // cowrie interactive sessions: explode raw_events
  const isCowrieSession = (record.doc_type === 'session') || (record.attack_id?.startsWith('sess-'));
  if (isCowrieSession && (record.raw_events?.length)) {
    const attackId = record.attack_id || record.id || `sess-${index}`;
    const portNum = 22;
    const all = (record.raw_events || [])
      .filter((ev) => ev && ev.eventid !== 'cowrie.session.closed');

    // track attempts count from session field
    const attemptsCount = (Number(record.total_login_attempts) || 0) + (Number(record.total_commands) || 0);
    if (attemptsCount > 0) attackAttemptCounts.set(String(attackId), attemptsCount);

    // vt lookup from session downloads
    const dlIndex = new Map<string, NonNullable<RawHoneypotRecord['downloads']>[number]>();
    (record.downloads || []).forEach((d) => {
      if (d.sha256) dlIndex.set(d.sha256, d);
      if (d.shasum) dlIndex.set(d.shasum, d);
      if (d.url) dlIndex.set(d.url, d);
    });

    const mitre = record.mitre?.names?.length
      ? record.mitre!.names!.map((name) => ({ tactic: name.split(':')[0] || name, technique: name }))
      : [{ tactic: 'Execution', technique: 'Command and Control' }];

    return all.map((ev, i) => {
      const ts = normalizeTimestamp(ev.timestamp || record.start_time || record.timestamp);
      const base: HoneypotEvent = {
        id: `${attackId}-${index}-${i}`,
        original_id: String(attackId),
        timestamp: ts,
        sensor: record.sensor || 'cowrie',
        sensor_type: 'cowrie',
        src_ip: record.src_ip || 'unknown',
        dst_port: portNum,
        protocol: 'ssh',
        event_type: 'ssh_command',
        geoip: mapGeo(record.geoip),
        ti: { abuseipdb: mapThreatIntel(record)?.abuseipdb, mitre },
        attack: (record.attack_types && record.attack_types.length > 0)
          ? record.attack_types.join(', ')
          : 'ssh interactive session',
        raw: ev,
      };

      if (ev.eventid === 'cowrie.login.success') {
        return {
          ...base,
          event_type: 'ssh_login_success',
          ssh: { username: ev.username, password: ev.password },
          auth: { username: ev.username, password: ev.password, result: 'success' },
        };
      }

      if (ev.eventid === 'cowrie.command.input') {
        const derived = (ev.attack_types && ev.attack_types[0]) || undefined;
        const mappedType = derived
          ? derived
          : 'ssh_command';
        return {
          ...base,
          event_type: mappedType,
          command: { raw: ev.input || ev.command || '', category: 'ssh' },
        };
      }

      if (ev.eventid === 'cowrie.session.file_download') {
        const key = ev.sha256 || ev.shasum || ev.url || '';
        const dl = key ? dlIndex.get(key) : undefined;
        const vt = (dl as any)?.virustotal || (dl as any)?.vt;
        const detections = vt ? (Number(vt.malicious || 0) + Number(vt.suspicious || 0)) : undefined;
        const ti = base.ti ? { ...base.ti, virustotal: detections !== undefined ? { reputation: 0, detections } : undefined } : undefined;
        return {
          ...base,
          event_type: 'file_download',
          http: ev.url ? { url: ev.url } : undefined,
          ti,
          command: undefined,
        };
      }

      return base;
    });
  }

  if (!record.attempts || record.attempts.length === 0) {
    return [toHoneypotEvent(record, index)];
  }

  const proto = record.protocol ? record.protocol.toLowerCase() : 'unknown';
  const portNum = Number(record.dst_port) || 0;
  const isHttps = proto === 'https' || portNum === 443;
  const scheme = isHttps ? 'https' : 'http';

    return record.attempts.map((att, i) => {
    const ts = normalizeTimestamp(att.timestamp);
    const host = att.hostname || (record.raw as any)?.dst_host || (record.raw as any)?.logdata?.HOSTNAME;
    const path = att.path || (record.raw as any)?.logdata?.PATH;
    const baseUrl = host
      ? host.startsWith('http')
        ? host
        : `${scheme}://${host}`
      : undefined;
    const url = baseUrl ? `${baseUrl}${path || ''}` : undefined;

    const http = url ? { url } : undefined;

    const totalAtt = Number(record.total_attempts);
    if ((record.attack_id || record.id) && totalAtt > 0) {
      attackAttemptCounts.set(String(record.attack_id || record.id), totalAtt);
    } else if ((record.attack_id || record.id) && record.attempts) {
      attackAttemptCounts.set(String(record.attack_id || record.id), record.attempts.length);
    }

    const sshCreds = proto === 'ssh' && (att.username || att.password)
      ? { username: att.username, password: att.password }
      : undefined;
    const httpAuth = proto !== 'ssh' && (att.username || att.password)
      ? { username: att.username, password: att.password, result: undefined }
      : undefined;

    return {
      id: `${record.attack_id || record.id || 'evt'}-${index}-${i}`,
      original_id: record.attack_id || record.id,
      timestamp: ts,
      sensor: record.sensor || 'unknown',
      sensor_type: record.sensor_type || 'unknown',
      src_ip: record.src_ip || 'unknown',
      dst_port: portNum,
      protocol: proto,
      event_type: att.event_type || (record.raw as any)?.eventid || 'unknown',
      geoip: mapGeo(record.geoip),
      ssh: sshCreds || (record.ssh ? { username: record.ssh.username, password: record.ssh.password } : undefined),
      auth: httpAuth,
      http,
      ti: mapThreatIntel(record),
      raw: record.raw,
      command: record.command,
      attack: record.attack,
    };
  });
}

let cached: { data: HoneypotEvent[]; ts: number } | null = null;

async function loadEvents(): Promise<HoneypotEvent[]> {
  const now = Date.now();
  if (cached && now - cached.ts < 10000) return cached.data;

  try {
    const parsedRecords = ndjsonSources.flatMap(parseNdjson);
    const mapped = parsedRecords.flatMap(attemptsToEvents);
    const data = mapped.length > 0
      ? mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      : generateHoneypotEvents(250).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    cached = { data, ts: now };
    return data;
  } catch (error) {
    console.error('Failed to load honeypot data, returning empty dataset:', error);
    const data = generateHoneypotEvents(250);
    cached = { data, ts: now };
    return data;
  }
}

function filterEvents(
  events: HoneypotEvent[],
  range: TimeRange,
  filters: Filters
): HoneypotEvent[] {
  const fromDate = new Date(range.from);
  const toDate = new Date(range.to);

  return events.filter((event) => {
    const eventDate = new Date(event.timestamp);
    if (eventDate < fromDate || eventDate > toDate) return false;

    if (filters.sensors.length > 0) {
      const sensorMatch = filters.sensors.includes(event.sensor) || filters.sensors.includes(event.sensor_type || '');
      if (!sensorMatch) return false;
    }

    if (filters.protocols.length > 0 && !filters.protocols.includes(event.protocol)) {
      return false;
    }

    if (filters.countries.length > 0) {
      const evIso2 = normalizeIso2(event.geoip?.country_iso_code, (event.geoip as any)?.country);
      const filterSet = new Set(filters.countries.map(normalizeFilterCountry));
      if (!evIso2 || !filterSet.has(evIso2)) return false;
    }

    if (filters.eventTypes && filters.eventTypes.length > 0) {
      const labels = filters.eventTypes.map((t) => t.toLowerCase());
      const fields = [event.event_type, event.attack, event.protocol]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      const matches = labels.some((l) => fields.some((f) => f.includes(l)));
      if (!matches) return false;
    }

    if (filters.ipAddress) {
      const q = filters.ipAddress.trim();
      if (q) {
        const match = event.src_ip?.includes(q);
        if (!match) return false;
      }
    }

    if (filters.usernameQuery) {
      const q = filters.usernameQuery.toLowerCase();
      const userFields = [event.ssh?.username, event.auth?.username]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(' ');
      if (!userFields.includes(q)) return false;
    }

    if (filters.passwordQuery) {
      const q = filters.passwordQuery.toLowerCase();
      const passFields = [event.ssh?.password, event.auth?.password]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(' ');
      if (!passFields.includes(q)) return false;
    }

    // Backwards-compat combined credentials query
    if (filters.credentialsQuery) {
      const q = filters.credentialsQuery.toLowerCase();
      const creds = [event.ssh?.username, event.ssh?.password, event.auth?.username, event.auth?.password]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(' ');
      if (!creds.includes(q)) return false;
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      const searchable = [
        event.src_ip,
        event.ssh?.username,
        event.ssh?.password,
        event.http?.url,
        event.event_type,
        event.protocol,
        event.sensor_type,
        String(event.dst_port),
        event.geoip?.country_iso_code,
        event.attack,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

export const demoAdapter = {
  async getSummary(range: TimeRange, filters: Filters): Promise<KPISummary> {
    const events = await loadEvents();
    const filtered = filterEvents(events, range, filters);

    const uniqueIps = new Set(filtered.map((e) => e.src_ip)).size;
    const uniqueSensors = new Set(filtered.map((e) => e.sensor)).size;
    const uniqueCountries = new Set(
      filtered.map((e) => e.geoip?.country_iso_code).filter(Boolean)
    ).size;
    // total attempts: prefer aggregated counts when available, otherwise fallback to events length
    const filteredAttackIds = Array.from(
      new Set(filtered.map((e) => e.original_id).filter(Boolean) as string[])
    );
    const aggAttempts = filteredAttackIds.reduce((sum, id) => sum + (attackAttemptCounts.get(id) || 0), 0);
    const totalAttempts = aggAttempts > 0 ? aggAttempts : filtered.length;

    // total attacks: distinct attack ids in the filtered window
    const totalAttacks = filteredAttackIds.length || totalAttempts;

    return {
      totalAttacks,
      totalAttempts,
      uniqueIps,
      uniqueSensors,
      uniqueCountries,
    };
  },

  async getAttacksOverTime(
    range: TimeRange,
    filters: Filters
  ): Promise<TimeSeriesPoint[]> {
    const events = await loadEvents();
    let filtered = filterEvents(events, range, filters);
    if (filtered.length === 0) {
      const wideRange: TimeRange = {
        from: '1970-01-01T00:00:00.000Z',
        to: new Date().toISOString(),
        preset: 'custom',
      };
      filtered = filterEvents(events, wideRange, filters);
    }

    // Determine bucket size based on time range
    const fromDate = new Date(range.from);
    const toDate = new Date(range.to);
    const diffMs = toDate.getTime() - fromDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let bucketMs: number;
    if (diffHours <= 1) bucketMs = 5 * 60 * 1000; // 5 minutes
    else if (diffHours <= 24) bucketMs = 60 * 60 * 1000; // 1 hour
    else if (diffHours <= 168) bucketMs = 6 * 60 * 60 * 1000; // 6 hours
    else bucketMs = 24 * 60 * 60 * 1000; // 1 day

    const buckets = new Map<string, { count: number; bySensor: Record<string, number> }>();

    filtered.forEach((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      const bucketTime = Math.floor(eventTime / bucketMs) * bucketMs;
      const bucketKey = new Date(bucketTime).toISOString();

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, { count: 0, bySensor: {} });
      }

      const bucket = buckets.get(bucketKey)!;
      bucket.count++;
      bucket.bySensor[event.sensor] = (bucket.bySensor[event.sensor] || 0) + 1;
    });

    return Array.from(buckets.entries())
      .map(([ts, data]) => ({ ts, count: data.count, bySensor: data.bySensor }))
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  },

  async getTopPorts(range: TimeRange, filters: Filters): Promise<TopItem[]> {
    const events = await loadEvents();
    const filtered = filterEvents(events, range, filters);

    const counts = new Map<number, number>();
    filtered.forEach((event) => {
      counts.set(event.dst_port, (counts.get(event.dst_port) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([port, count]) => ({ label: String(port), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  async getTopIps(range: TimeRange, filters: Filters): Promise<TopItem[]> {
    const events = await loadEvents();
    const filtered = filterEvents(events, range, filters);

    const counts = new Map<string, number>();
    filtered.forEach((event) => {
      counts.set(event.src_ip, (counts.get(event.src_ip) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([ip, count]) => ({ label: ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  async getEventTypes(range: TimeRange, filters: Filters): Promise<TopItem[]> {
    const events = await loadEvents();
    const filtered = filterEvents(events, range, filters);

    const counts = new Map<string, number>();
    const add = (label?: string) => {
      const k = (label || '').trim();
      const lower = k.toLowerCase();
      if (lower === 'ssh interactive session') return;
      if (!k) return;
      counts.set(k, (counts.get(k) || 0) + 1);
    };
    filtered.forEach((event) => {
      const raw = event.raw as any;
      const types = Array.isArray(raw?.attack_types) ? raw.attack_types : undefined;
      if (types && types.length > 0) {
        types.forEach((t: string) => add(t));
        return;
      }
      if (event.attack && event.attack.includes(',')) {
        event.attack.split(',').forEach((t) => add(t));
        return;
      }
      if (event.event_type === 'file_download') {
        add('file_download');
        return;
      }
      add(event.attack || event.event_type);
    });

    return Array.from(counts.entries())
      .map(([type, count]) => ({ label: type, count }))
      .sort((a, b) => b.count - a.count);
  },

  async getTopCountries(range: TimeRange, filters: Filters): Promise<TopItem[]> {
    const events = await loadEvents();
    const filtered = filterEvents(events, range, filters);

    const counts = new Map<string, number>();
    filtered.forEach((event) => {
      const iso = normalizeIso2(event.geoip?.country_iso_code, (event.geoip as any)?.country);
      if (iso) {
        counts.set(iso, (counts.get(iso) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([country, count]) => ({ label: country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  },

  async getRecentEvents(
    range: TimeRange,
    filters: Filters,
    page: number,
    size: number
  ): Promise<PaginatedResponse<HoneypotEvent>> {
    const events = await loadEvents();
    const filtered = filterEvents(events, range, filters);

    const start = page * size;
    const rows = filtered.slice(start, start + size);

    return {
      rows,
      total: filtered.length,
      page,
      pageSize: size,
    };
  },

  async getMapPoints(range: TimeRange, filters: Filters): Promise<MapPoint[]> {
    const events = await loadEvents();
    let filtered = filterEvents(events, range, filters);
    const noUserFilters =
      filters.countries.length === 0 &&
      filters.sensors.length === 0 &&
      filters.protocols.length === 0 &&
      !filters.query;
    if (filtered.length === 0 && noUserFilters) {
      filtered = events; // fallback to all-time when time window yields no points and no user filters are applied
    }

    const pointMap = new Map<string, MapPoint>();

  const centroids: Record<string, { lat: number; lon: number }> = {
      US: { lat: 39.78, lon: -98.57 },
      GB: { lat: 55.38, lon: -3.44 },
      DE: { lat: 51.16, lon: 10.45 },
      FR: { lat: 46.23, lon: 2.21 },
      CN: { lat: 35.86, lon: 104.19 },
      RU: { lat: 61.52, lon: 105.32 },
      IN: { lat: 20.59, lon: 78.96 },
      AE: { lat: 23.42, lon: 53.85 },
      SA: { lat: 23.88, lon: 45.07 },
      EG: { lat: 26.82, lon: 30.8 },
      IQ: { lat: 33.22, lon: 43.68 },
      TR: { lat: 38.96, lon: 35.24 },
      OM: { lat: 23.5880, lon: 58.3829 },
    };

    const iso3to2: Record<string, string> = {
      USA: 'US',
      GBR: 'GB',
      DEU: 'DE',
      FRA: 'FR',
      CHN: 'CN',
      RUS: 'RU',
      IND: 'IN',
      ARE: 'AE',
      SAU: 'SA',
      EGY: 'EG',
      IRQ: 'IQ',
      TUR: 'TR',
      OMN: 'OM',
    };

    const nameToIso: Record<string, string> = {
      'united states': 'US',
      'united states of america': 'US',
      usa: 'US',
      'united kingdom': 'GB',
      uk: 'GB',
      germany: 'DE',
      france: 'FR',
      china: 'CN',
      russia: 'RU',
      india: 'IN',
      'united arab emirates': 'AE',
      'saudi arabia': 'SA',
      egypt: 'EG',
      iraq: 'IQ',
      turkey: 'TR',
      oman: 'OM',
    };

    filtered.forEach((event) => {
      let lat: number | undefined;
      let lon: number | undefined;
      const iso = normalizeIso2(event.geoip?.country_iso_code, (event.geoip as any)?.country);
      const countryName = (event.geoip as any)?.country as string | undefined;

      const isOman = iso === 'OM' || (countryName && countryName.trim().toLowerCase() === 'oman');
      if (isOman) {
        lat = centroids.OM.lat;
        lon = centroids.OM.lon;
      } else if (event.geoip?.location) {
        lat = event.geoip.location.lat;
        lon = event.geoip.location.lon;
      } else if (iso && centroids[iso]) {
        lat = centroids[iso].lat;
        lon = centroids[iso].lon;
      }

      if (lat !== undefined && lon !== undefined) {
        const key = `${lat},${lon}`;
        if (!pointMap.has(key)) {
          pointMap.set(key, {
            lat,
            lon,
            count: 0,
            country: isOman ? 'OM' : (iso || countryName),
          });
        }
        const point = pointMap.get(key)!;
        point.count++;
      }
    });
    const hasOMFilter = filters.countries.map(normalizeFilterCountry).includes('OM');
    if (hasOMFilter) {
      const omanKey = `${centroids.OM.lat},${centroids.OM.lon}`;
      if (!pointMap.has(omanKey)) {
        const omanCountAll = events.reduce((sum, e) => {
          const iso2 = normalizeIso2(e.geoip?.country_iso_code, (e.geoip as any)?.country);
          return sum + (iso2 === 'OM' ? 1 : 0);
        }, 0);
        pointMap.set(omanKey, { lat: centroids.OM.lat, lon: centroids.OM.lon, count: omanCountAll, country: 'OM' });
      }
    }

    return Array.from(pointMap.values());
  },

  async getTopSSHUsernames(range: TimeRange, filters: Filters): Promise<TopItem[]> {
    const events = await loadEvents();
    const filtered = filterEvents(events, range, filters).filter((e) => e.ssh?.username);

    const counts = new Map<string, number>();
    filtered.forEach((event) => {
      const username = event.ssh?.username;
      if (username) {
        counts.set(username, (counts.get(username) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([username, count]) => ({ label: username, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  async getTopSSHPasswords(range: TimeRange, filters: Filters): Promise<TopItem[]> {
    const events = await loadEvents();
    const filtered = filterEvents(events, range, filters).filter((e) => e.ssh?.password);

    const counts = new Map<string, number>();
    filtered.forEach((event) => {
      const password = event.ssh?.password;
      if (password) {
        counts.set(password, (counts.get(password) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([password, count]) => ({ label: password, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  async getTISummary(range: TimeRange, filters: Filters): Promise<TISummary> {
    const events = await loadEvents();
    const filtered = filterEvents(events, range, filters);

    // Count malicious IPs (AbuseIPDB score >= 70)
    const maliciousIps = new Set(
      filtered
        .filter((e) => e.ti?.abuseipdb && e.ti.abuseipdb.score >= 70)
        .map((e) => e.src_ip)
    ).size;

    // Calculate average VT detections
    const vtDetections = filtered
      .filter((e) => e.ti?.virustotal?.detections !== undefined)
      .map((e) => e.ti!.virustotal!.detections);
    const avgVTDetections = vtDetections.length > 0
      ? vtDetections.reduce((sum, d) => sum + d, 0) / vtDetections.length
      : 0;

    // Top malware families
    const malwareCounts = new Map<string, number>();
    filtered.forEach((event) => {
      const family = event.ti?.malwarebazaar?.family;
      if (family) {
        malwareCounts.set(family, (malwareCounts.get(family) || 0) + 1);
      }
    });
    const topMalwareFamilies = Array.from(malwareCounts.entries())
      .map(([family, count]) => ({ family, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top malicious IPs with full TI context
    const ipMap = new Map<string, {
      count: number;
      abuseScore?: number;
      vtDetections?: number;
      malwareFamily?: string;
      mitreTactics: Set<string>;
    }>();

    filtered.forEach((event) => {
      const ip = event.src_ip;
      if (!ipMap.has(ip)) {
        ipMap.set(ip, {
          count: 0,
          mitreTactics: new Set(),
        });
      }
      const entry = ipMap.get(ip)!;
      entry.count++;

      if (event.ti?.abuseipdb) {
        entry.abuseScore = Math.max(entry.abuseScore || 0, event.ti.abuseipdb.score);
      }
      if (event.ti?.virustotal) {
        entry.vtDetections = Math.max(entry.vtDetections || 0, event.ti.virustotal.detections);
      }
      if (event.ti?.malwarebazaar?.family) {
        entry.malwareFamily = event.ti.malwarebazaar.family;
      }
      if (event.ti?.mitre) {
        event.ti.mitre.forEach((m) => entry.mitreTactics.add(m.tactic));
      }
    });

    const topMaliciousIps = Array.from(ipMap.entries())
      .filter(([_, data]) => data.abuseScore && data.abuseScore >= 70)
      .map(([ip, data]) => ({
        ip,
        count: data.count,
        abuseScore: data.abuseScore,
        vtDetections: data.vtDetections,
        malwareFamily: data.malwareFamily,
        mitreTactics: Array.from(data.mitreTactics),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const uploadMap = new Map<string, { hash: string; url?: string; detections?: number; count: number }>();
    filtered
      .filter((e) => e.event_type === 'file_download')
      .forEach((e) => {
        const raw = e.raw as any;
        const hash = (raw && (raw.sha256 || raw.shasum)) as string | undefined;
        if (!hash) return;
        if (!uploadMap.has(hash)) {
          uploadMap.set(hash, { hash, url: e.http?.url, detections: e.ti?.virustotal?.detections, count: 0 });
        }
        const entry = uploadMap.get(hash)!;
        entry.count++;
        if (e.http?.url) entry.url = e.http.url;
        if (e.ti?.virustotal?.detections !== undefined) {
          entry.detections = Math.max(entry.detections || 0, e.ti!.virustotal!.detections);
        }
      });

    const topUploads = Array.from(uploadMap.values())
      .sort((a, b) => (b.detections || 0) - (a.detections || 0) || b.count - a.count)
      .slice(0, 10);

    return {
      maliciousIps,
      avgVTDetections: Math.round(avgVTDetections * 10) / 10,
      topMalwareFamilies,
      topMaliciousIps,
      topUploads,
    };
  },
};
const attackAttemptCounts = new Map<string, number>();
function cowrieSessionToEvent(record: RawHoneypotRecord, index: number): HoneypotEvent {
  const attackId = record.attack_id || record.id || `bf-${index}`;
  const timestamp = normalizeTimestamp(record.start_time || record.timestamp);
  const portNum = 22;

  // track attempt counts from aggregated field
  const attemptsCount = Number(record.total_login_attempts) || 0;
  if (attemptsCount > 0) {
    attackAttemptCounts.set(String(attackId), attemptsCount);
  }

  return {
    id: `${attackId}-${index}`,
    original_id: String(attackId),
    timestamp,
    sensor: record.sensor || 'cowrie',
    sensor_type: 'cowrie',
    src_ip: record.src_ip || 'unknown',
    dst_port: portNum,
    protocol: 'ssh',
    event_type: 'ssh_login_attempt',
    geoip: mapGeo(record.geoip),
    ssh: undefined,
    http: undefined,
    ti: {
      abuseipdb: mapThreatIntel(record)?.abuseipdb,
      mitre: [
        { tactic: 'Credential Access', technique: 'Brute Force' },
      ],
    },
    raw: record.raw,
    attack: 'ssh bruteforce',
  };
}
