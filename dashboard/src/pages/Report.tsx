import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import cowrieRaw from '@/data/attacktell/cowrieattacktell.ndjson?raw';
import opencanaryRaw from '@/data/attacktell/opencanaryattacktell.ndjson?raw';
import dionaeaRaw from '@/data/attacktell/dionaeaattacktell.ndjson?raw';
import { Button } from '@/components/ui/button';
import { useFilters } from '@/context/FiltersContext';
import { getAdapter } from '@/data';
import { useQuery } from '@tanstack/react-query';
import { FilterSummaryModal } from '@/components/dashboard/FilterSummaryModal';

function Report() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const [generating, setGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const initialOpen = !!((location.state as any)?.fromAdvanced);
  const [summaryOpen, setSummaryOpen] = useState<boolean>(initialOpen);

  const { data: summary } = useQuery({
    queryKey: ['report-summary', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getSummary(timeRange, filters),
    staleTime: 30000,
  });
  const { data: eventTypes } = useQuery({
    queryKey: ['report-event-types', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getEventTypes(timeRange, filters),
    staleTime: 30000,
  });
  const { data: topPorts } = useQuery({
    queryKey: ['report-top-ports', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getTopPorts(timeRange, filters),
    staleTime: 30000,
  });
  const { data: topIps } = useQuery({
    queryKey: ['report-top-ips', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getTopIps(timeRange, filters),
    staleTime: 30000,
  });
  const { data: topCountries } = useQuery({
    queryKey: ['report-top-countries', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getTopCountries(timeRange, filters),
    staleTime: 30000,
  });
  const { data: recent } = useQuery({
    queryKey: ['report-recent', timeRange, filters, adapter],
    queryFn: () => dataAdapter.getRecentEvents(timeRange, filters, 0, 50),
    staleTime: 30000,
  });

  const filterSummary = useMemo(() => {
    const s = filters.sensors.join(', ') || 'All';
    const p = filters.protocols.join(', ') || 'All';
    const c = filters.countries.join(', ') || 'All';
    const e = (filters.eventTypes || []).join(', ') || 'All';
    const ip = filters.ipAddress || '-';
    const user = filters.usernameQuery || '-';
    const pass = filters.passwordQuery || '-';
    return { sensors: s, protocols: p, countries: c, eventTypes: e, ip, user, pass };
  }, [filters]);

  type AttackTell = { attack_id: string; summary: string; more_details?: string };
  type LabelCount = { label: string; count: number };
  const attacksTell: AttackTell[] = useMemo(() => {
    const SOURCES: Record<string, string> = {
      cowrie: cowrieRaw,
      opencanary: opencanaryRaw,
      dionaea: dionaeaRaw,
    };
    const parse = (raw: string): AttackTell[] => (raw || '')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => { try { return JSON.parse(l) as AttackTell; } catch { return null; } })
      .filter(Boolean) as AttackTell[];
    const ts = (id: string): number => {
      const m = id.match(/-(\d{14})$/);
      return m ? Number(m[1]) : 0;
    };
    const selected = filters.sensors && filters.sensors.length ? filters.sensors : ['all'];
    const keys = selected.includes('all') ? Object.keys(SOURCES) : selected.filter((k) => k in SOURCES);
    const combined = keys.flatMap((k) => parse(SOURCES[k] || ''));
    const ordered = combined.slice().sort((a, b) => ts(b.attack_id) - ts(a.attack_id));
    return ordered.slice(0, 6);
  }, [filters.sensors]);

  const loadJsPDF = (): Promise<any> => new Promise((resolve, reject) => {
    const w: any = window as any;
    if (w.jspdf && w.jspdf.jsPDF) return resolve(w.jspdf);
    const sources = [
      '/libs/jspdf.umd.min.js',
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    ];
    let idx = 0;
    const tryLoad = () => {
      if (idx >= sources.length) return reject(new Error('Failed to load jsPDF'));
      const script = document.createElement('script');
      script.src = sources[idx++];
      script.async = true;
      script.onload = () => resolve((window as any).jspdf);
      script.onerror = () => {
        script.remove();
        tryLoad();
      };
      document.head.appendChild(script);
    };
    tryLoad();
  });

  const loadHtml2Pdf = (): Promise<any> => new Promise((resolve, reject) => {
    const w: any = window as any;
    if (w.html2pdf) return resolve(w.html2pdf);
    const sources = [
      'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
      'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
      'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
    ];
    let idx = 0;
    const tryLoad = () => {
      if (idx >= sources.length) return reject(new Error('Failed to load html2pdf'));
      const script = document.createElement('script');
      script.src = sources[idx++];
      script.async = true;
      script.onload = () => resolve((window as any).html2pdf);
      script.onerror = () => { script.remove(); tryLoad(); };
      document.head.appendChild(script);
    };
    tryLoad();
  });

  const onDownload = async () => {
    try {
      setGenerating(true);
      const html2pdf = await loadHtml2Pdf();
      await html2pdf().from(containerRef.current!).set({
        margin: 16,
        filename: 'smart-honeypot-report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      }).save();
    } catch (e) {
      alert('Failed to generate PDF.');
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 p-6 report-container">
      <FilterSummaryModal
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        filterSummary={filterSummary}
        timeRange={{ from: timeRange.from, to: timeRange.to }}
        onDownload={onDownload}
      />
     <div className="flex justify-between items-center">
       <h1 className="text-2xl font-bold">Smart Honeypot — Attacks Report</h1>
       <Button onClick={onDownload} disabled={generating}>{generating ? 'Generating…' : 'Download PDF'}</Button>
     </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-2">Time Range</h2>
          <p className="text-sm">From: {new Date(timeRange.from).toLocaleString()}</p>
          <p className="text-sm">To: {new Date(timeRange.to).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-2">Filters</h2>
          <p className="text-sm">Sensors: {filterSummary.sensors}</p>
          <p className="text-sm">Protocols: {filterSummary.protocols}</p>
          <p className="text-sm">Countries: {filterSummary.countries}</p>
          <p className="text-sm">Event Types: {filterSummary.eventTypes}</p>
          <p className="text-sm">IP: {filterSummary.ip}</p>
          <p className="text-sm">Username: {filterSummary.user}</p>
          <p className="text-sm">Password: {filterSummary.pass}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Total Attacks</div>
            <div className="text-xl font-bold">{summary?.totalAttacks ?? '-'}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Total Attempts</div>
            <div className="text-xl font-bold">{summary?.totalAttempts ?? '-'}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Unique Source IPs</div>
            <div className="text-xl font-bold">{summary?.uniqueIps ?? '-'}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Countries Involved</div>
            <div className="text-xl font-bold">{summary?.uniqueCountries ?? '-'}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-2">Top Attack Types</h2>
          <ol className="text-sm list-decimal ml-5">
            {(eventTypes || []).slice(0, 10).map((t) => (
              <li key={t.label}>{t.label} — {t.count}</li>
            ))}
          </ol>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-2">Top Ports</h2>
          <ol className="text-sm list-decimal ml-5">
            {(topPorts || []).slice(0, 10).map((t) => (
              <li key={t.label}>Port {t.label} — {t.count}</li>
            ))}
          </ol>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-2">Top Source IPs</h2>
          <ol className="text-sm list-decimal ml-5">
            {(topIps || []).slice(0, 10).map((t) => (
              <li key={t.label}>{t.label} — {t.count}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Attacks tell (summaries)</h2>
        {attacksTell.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attacks tell entries for selected sensors.</p>
        ) : (
          <ol className="text-sm list-decimal ml-5">
            {attacksTell.map((a) => (
              <li key={a.attack_id}><span className="font-mono">{a.attack_id}</span> — {a.summary}</li>
            ))}
          </ol>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Countries</h2>
        <ol className="text-sm list-decimal ml-5">
          {(topCountries || []).slice(0, 15).map((t) => (
            <li key={t.label}>{t.label} — {t.count}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Recent Events (first 50)</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Time</th>
              <th className="border p-2">Sensor</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Source IP</th>
              <th className="border p-2">Protocol</th>
              <th className="border p-2">Port</th>
              <th className="border p-2">Event</th>
              <th className="border p-2">Country</th>
            </tr>
          </thead>
          <tbody>
            {(recent?.rows || []).map((e) => (
              <tr key={e.id}>
                <td className="border p-2">{new Date(e.timestamp).toLocaleString()}</td>
                <td className="border p-2">{e.sensor}</td>
                <td className="border p-2">{e.sensor_type}</td>
                <td className="border p-2">{e.src_ip}</td>
                <td className="border p-2">{e.protocol}</td>
                <td className="border p-2">{e.dst_port}</td>
                <td className="border p-2">{e.event_type}</td>
                <td className="border p-2">{e.geoip?.country_iso_code || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{'.report-container { background: #ffffff; color: #000000; } .page-break { page-break-after: always; }'}</style>
    </div>
  );
}

export default Report;
