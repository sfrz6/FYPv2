import type { HoneypotEvent } from '@/types';

const sensors = ['cowrie-1', 'dionaea-1', 'canary-1'];
const sensorTypes: ('cowrie' | 'dionaea' | 'opencanary')[] = [
  'cowrie',
  'dionaea',
  'opencanary',
];
const protocols: ('ssh' | 'http' | 'ftp' | 'smb')[] = ['ssh', 'http', 'ftp', 'smb'];
const eventTypes = [
  'ssh_login_attempt',
  'http_probe',
  'ftp_connection',
  'malware_download',
];
const ports = [22, 80, 21, 445, 443, 3389, 3306, 5432];

const countries = [
  { code: 'US', lat: 37.77, lon: -122.42, city: 'San Francisco' },
  { code: 'DE', lat: 52.52, lon: 13.4, city: 'Berlin' },
  { code: 'CN', lat: 39.9, lon: 116.4, city: 'Beijing' },
  { code: 'GB', lat: 51.5, lon: -0.12, city: 'London' },
  { code: 'RU', lat: 55.75, lon: 37.61, city: 'Moscow' },
  { code: 'BR', lat: -23.55, lon: -46.63, city: 'São Paulo' },
  { code: 'FR', lat: 48.85, lon: 2.35, city: 'Paris' },
  { code: 'IN', lat: 28.61, lon: 77.2, city: 'New Delhi' },
  { code: 'JP', lat: 35.68, lon: 139.76, city: 'Tokyo' },
  { code: 'KR', lat: 37.56, lon: 126.97, city: 'Seoul' },
  { code: 'AU', lat: -33.86, lon: 151.2, city: 'Sydney' },
  { code: 'CA', lat: 43.65, lon: -79.38, city: 'Toronto' },
  { code: 'IT', lat: 41.89, lon: 12.51, city: 'Rome' },
  { code: 'ES', lat: 40.41, lon: -3.7, city: 'Madrid' },
  { code: 'NL', lat: 52.37, lon: 4.89, city: 'Amsterdam' },
];

const usernames = ['root', 'admin', 'user', 'test', 'ubuntu', 'pi', 'oracle', 'postgres'];
const passwords = [
  '123456',
  'password',
  'admin123',
  'root',
  '12345678',
  'qwerty',
  'raspberry',
];
const urls = [
  'http://example.com/login',
  'http://example.com/admin',
  'https://example.com/api',
  'http://example.com/wp-admin',
  'http://example.com/phpmyadmin',
];

const malwareFamilies = ['Mirai', 'Emotet', 'TrickBot', 'Qakbot', 'Zeus', 'Dridex', 'Cobalt Strike'];
const mitreTactics = [
  { tactic: 'Initial Access', technique: 'T1190' },
  { tactic: 'Credential Access', technique: 'T1110' },
  { tactic: 'Discovery', technique: 'T1046' },
  { tactic: 'Command and Control', technique: 'T1071' },
  { tactic: 'Execution', technique: 'T1059' },
  { tactic: 'Persistence', technique: 'T1547' },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp(): string {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

export function generateHoneypotEvents(count: number, startDate?: Date): HoneypotEvent[] {
  const events: HoneypotEvent[] = [];
  const now = startDate || new Date();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const sensor = randomItem(sensors);
    const protocol = randomItem(protocols);
    const country = randomItem(countries);
    const port = randomItem(ports);

    let eventType = randomItem(eventTypes);
    // Match event type to protocol
    if (protocol === 'ssh') eventType = 'ssh_login_attempt';
    if (protocol === 'http') eventType = 'http_probe';
    if (protocol === 'ftp') eventType = 'ftp_connection';
    if (protocol === 'smb') eventType = 'malware_download';

    const event: HoneypotEvent = {
      id: `evt-${String(i + 1).padStart(4, '0')}`,
      timestamp: timestamp.toISOString(),
      sensor,
      sensor_type: sensor.includes('cowrie')
        ? 'cowrie'
        : sensor.includes('dionaea')
          ? 'dionaea'
          : 'opencanary',
      src_ip: randomIp(),
      dst_port: port,
      protocol,
      event_type: eventType,
      geoip: {
        country_iso_code: country.code,
        city_name: country.city,
        location: { lat: country.lat, lon: country.lon },
      },
    };

    // Add protocol-specific fields
    if (protocol === 'ssh' && Math.random() > 0.3) {
      event.ssh = {
        username: randomItem(usernames),
        password: randomItem(passwords),
      };
    }

    if (protocol === 'http' && Math.random() > 0.3) {
      event.http = {
        url: randomItem(urls),
      };
    }

    // Add TI data (70% of events have TI)
    if (Math.random() > 0.3) {
      const abuseScore = Math.floor(Math.random() * 100);
      const vtDetections = Math.floor(Math.random() * 70);
      const hasMalware = Math.random() > 0.7;
      
      event.ti = {
        abuseipdb: { score: abuseScore },
        virustotal: { 
          reputation: Math.max(-100, -vtDetections + Math.floor(Math.random() * 20)), 
          detections: vtDetections 
        },
      };

      if (hasMalware) {
        event.ti.malwarebazaar = {
          family: randomItem(malwareFamilies),
          hash: Math.random().toString(36).substr(2, 32),
          last_seen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      if (Math.random() > 0.5) {
        const numTactics = Math.floor(Math.random() * 3) + 1;
        event.ti.mitre = Array.from({ length: numTactics }, () => randomItem(mitreTactics));
      }
    }

    events.push(event);
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
