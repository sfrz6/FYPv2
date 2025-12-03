import { useMemo, useRef, useState } from 'react';
import cowrieRaw from '@/data/attacktell/cowrieattacktell.ndjson?raw';
import { Button } from '@/components/ui/button';
import { useFilters } from '@/context/FiltersContext';
import { getAdapter } from '@/data';
import { useQuery } from '@tanstack/react-query';

export default function Report() {
  const { timeRange, filters, adapter } = useFilters();
  const dataAdapter = getAdapter(adapter);
  const [generating, setGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    return { sensors: s, protocols: p, countries: c, eventTypes: e };
  }, [filters]);

  type AttackTell = { attack_id: string; summary: string; more_details?: string };
  type LabelCount = { label: string; count: number };
  const attacksTell: AttackTell[] = useMemo(() => {
    const selected = filters.sensors;
    const includeCowrie = selected.length === 0 || selected.includes('cowrie');
    if (!includeCowrie) return [];
    const lines = (cowrieRaw || '').trim().split('\n').filter(Boolean);
    const items = lines.map((l) => { try { return JSON.parse(l) as AttackTell; } catch { return null; } }).filter(Boolean) as AttackTell[];
    return items.slice(-6).reverse();
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
      // Preferred: export DOM to PDF matching dashboard layout
      const html2pdf = await loadHtml2Pdf();
      const opt = {
        margin: 16,
        filename: 'smart-honeypot-report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };
      await html2pdf().from(containerRef.current!).set(opt).save();
      setGenerating(false);
      return;
    } catch (e) {
      // Fallback to programmatic jsPDF
      try {
        const jspdf = await loadJsPDF();
        const { jsPDF } = jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const marginL = 40; const marginR = 555; const brand = { r: 26, g: 159, b: 61 };
    const line = (y: number) => { doc.setDrawColor(200); doc.line(marginL, y, marginR, y); };
    const heading = (text: string, y: number) => { doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.text(text, marginL, y); };
    const label = (text: string, y: number, muted = false) => { doc.setTextColor(muted ? 100 : 0); doc.setFontSize(11); doc.setFont(undefined, 'normal'); doc.text(text, marginL, y); };

    // Header
    doc.setFillColor(brand.r, brand.g, brand.b);
    doc.rect(marginL, 40, 24, 24, 'F');
    doc.setFont(undefined, 'bold'); doc.setFontSize(18); doc.text('Smart Honeypot', marginL + 34, 58);
    label(new Date().toLocaleString(), 80, true);

    let y = 120;
    heading('Attacks Report', y); y += 20; line(y); y += 20;

    label(`Time Range: ${new Date(timeRange.from).toLocaleString()} → ${new Date(timeRange.to).toLocaleString()}`, y); y += 18;
    const s = filters.sensors.join(', ') || 'All';
    const p = filters.protocols.join(', ') || 'All';
    const c = filters.countries.join(', ') || 'All';
    const e = (filters.eventTypes || []).join(', ') || 'All';
    label(`Filters • Sensors: ${s} • Protocols: ${p} • Countries: ${c} • Event Types: ${e}`, y); y += 24; line(y); y += 20;

    heading('Summary', y); y += 18;
    const box = (title: string, value: string | number, bx: number, by: number) => {
      doc.setDrawColor(220); if ((doc as any).roundedRect) { (doc as any).roundedRect(bx, by, 240, 60, 6); } else { doc.rect(bx, by, 240, 60); }
      doc.setFontSize(10); doc.setTextColor(100); doc.text(title, bx + 12, by + 22);
      doc.setFontSize(18); doc.setTextColor(0); doc.setFont(undefined, 'bold'); doc.text(String(value), bx + 12, by + 46);
    };
    box('Total Attacks', summary?.totalAttacks ?? '-', marginL, y);
    box('Total Attempts', summary?.totalAttempts ?? '-', marginL + 260, y);
    y += 80;
    box('Unique Source IPs', summary?.uniqueIps ?? '-', marginL, y);
    box('Countries Involved', summary?.uniqueCountries ?? '-', marginL + 260, y);
    y += 100; line(y); y += 20;

    const addList = (title: string, items: LabelCount[], max = 10) => {
      if (y > 720) { doc.addPage(); y = 60; }
      heading(title, y); y += 18;
      doc.setFontSize(11); doc.setFont(undefined, 'normal');
      (items || []).slice(0, max).forEach((t, i) => { if (y > 750) { doc.addPage(); y = 60; } doc.text(`${i + 1}. ${t.label} — ${t.count}`, marginL, y); y += 16; });
      y += 8; line(y); y += 20;
    };

    addList('Top Attack Types', eventTypes || [], 10);
    addList('Top Ports', topPorts || [], 10);
    addList('Top Source IPs', topIps || [], 10);
    addList('Countries', topCountries || [], 15);
    if ((attacksTell || []).length > 0) {
      if (y > 720) { doc.addPage(); y = 60; }
      heading('Attacks tell (summaries)', y); y += 18;
      doc.setFontSize(11);
      (attacksTell || []).forEach((a, i) => { if (y > 750) { doc.addPage(); y = 60; } doc.text(`${i + 1}. ${a.attack_id} — ${a.summary}`, 40, y); y += 16; });
      y += 8; line(y); y += 20;
    }

    if (y > 680) { doc.addPage(); y = 60; }
    heading('Recent Events (first 50)', y); y += 18;
    const rows = recent?.rows || [];
    doc.setFontSize(10);
    rows.slice(0, 50).forEach((e) => {
      if (y > 760) { doc.addPage(); y = 60; }
      const lineText = `${new Date(e.timestamp).toLocaleString()} • ${e.sensor} (${e.sensor_type}) • ${e.src_ip} • ${e.protocol}:${e.dst_port} • ${e.event_type} • ${e.geoip?.country_iso_code || '-'}`;
      doc.text(lineText, marginL, y);
      y += 14;
    });

    // Footer with page numbers
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setTextColor(120);
      doc.setFontSize(10);
      doc.text('Confidential · Smart Honeypot', marginL, 820);
      doc.text(`Page ${i}/${pages}`, marginR, 820, { align: 'right' });
    }

        doc.save('smart-honeypot-report.pdf');
        setGenerating(false);
        return;
      } catch (err) {
        console.error(err);
      // Fallback: generate a professional-looking multi-page PDF without external libs
      try {
        const esc = (t: string) => t.replace(/[\\()]/g, (m) => `\\${m}`);
        const marginL = 40, marginR = 555; const leading = 16; const maxChars = 92;
        const wrap = (txt: string) => {
          const words = txt.split(' '); const lines: string[] = []; let cur = '';
          words.forEach((w) => { if ((cur + ' ' + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; } else { cur = (cur ? cur + ' ' : '') + w; } });
          if (cur) lines.push(cur); return lines;
        };
        const s = filters.sensors.join(', ') || 'All';
        const p = filters.protocols.join(', ') || 'All';
        const c = filters.countries.join(', ') || 'All';
        const e = (filters.eventTypes || []).join(', ') || 'All';
        const allLines: string[] = [];
        const pushHeading = (t: string) => { allLines.push(''); allLines.push(t); allLines.push(''); };
        allLines.push('Smart Honeypot - Attacks Report');
        allLines.push(`Time Range: ${new Date(timeRange.from).toLocaleString()} -> ${new Date(timeRange.to).toLocaleString()}`);
        allLines.push(`Filters: Sensors ${s} | Protocols ${p} | Countries ${c} | Event Types ${e}`);
        allLines.push('');
        pushHeading('Summary');
        allLines.push(`Attacks ${summary?.totalAttacks ?? '-'}, Attempts ${summary?.totalAttempts ?? '-'}, IPs ${summary?.uniqueIps ?? '-'}, Countries ${summary?.uniqueCountries ?? '-'}`);
        pushHeading('Top Attack Types'); (eventTypes || []).slice(0, 10).forEach((t, i) => allLines.push(`${i + 1}. ${t.label} - ${t.count}`));
        pushHeading('Top Ports'); (topPorts || []).slice(0, 10).forEach((t, i) => allLines.push(`${i + 1}. ${t.label} - ${t.count}`));
        pushHeading('Top Source IPs'); (topIps || []).slice(0, 10).forEach((t, i) => allLines.push(`${i + 1}. ${t.label} - ${t.count}`));
        pushHeading('Countries'); (topCountries || []).slice(0, 15).forEach((t, i) => allLines.push(`${i + 1}. ${t.label} - ${t.count}`));
        const tellLines = (attacksTell || []).map((a, i) => `${i + 1}. ${a.attack_id} - ${a.summary}`);
        if (tellLines.length > 0) { pushHeading('Attacks tell (summaries)'); tellLines.forEach((l) => allLines.push(l)); }
        pushHeading('Recent Events');
        (recent?.rows || []).slice(0, 200).forEach((e) => allLines.push(`${new Date(e.timestamp).toLocaleString()} - ${e.sensor} - ${e.src_ip} - ${e.protocol}:${e.dst_port} - ${e.event_type} - ${e.geoip?.country_iso_code || '-'}`));

        // Wrap lines and paginate
        const wrappedLines = allLines.flatMap(wrap);
        const linesPerPage = 45;
        const pages: string[][] = [];
        for (let i = 0; i < wrappedLines.length; i += linesPerPage) pages.push(wrappedLines.slice(i, i + linesPerPage));
        const makeStream = (pageLines: string[]) => {
          let s = '';
          let lineY = 800;
          pageLines.forEach((l) => {
            s += `BT\n/F1 12 Tf\n0 0 0 rg\n1 0 0 1 ${marginL} ${lineY} Tm\n(${esc(l)}) Tj\nET\n`;
            lineY -= leading;
          });
          return s;
        };
        const pageStreams = pages.map(makeStream);

        // Build PDF objects for multiple pages
        const objCatalog = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
        const kids = pageStreams.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
        const objPages = `2 0 obj\n<< /Type /Pages /Kids [ ${kids} ] /Count ${pageStreams.length} >>\nendobj\n`;
        const fontObjId = 3 + pageStreams.length * 2;
        const objFont = `${fontObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
        const pageObjs: string[] = []; const contentObjs: string[] = [];
        pageStreams.forEach((stream, idx) => {
          const contentId = 4 + idx * 2;
          const pageId = 3 + idx * 2;
          const objContent = `${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`;
          const objPage = `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`;
          contentObjs.push(objContent); pageObjs.push(objPage);
        });
        let pdf = '%PDF-1.4\n'; const offsets: number[] = [0]; const parts = [objCatalog, objPages, ...pageObjs, ...contentObjs, objFont];
        parts.forEach((p, i) => { offsets[i + 1] = pdf.length; pdf += p; });
        const xrefStart = pdf.length; const xref = ['xref', `0 ${parts.length + 1}`, '0000000000 65535 f ']
          .concat(offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n `)).join('\n') + '\n';
        const trailer = `trailer\n<< /Size ${parts.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
        pdf += xref + trailer;
        const blob = new Blob([pdf], { type: 'application/pdf' }); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'smart-honeypot-report.pdf'; a.click(); URL.revokeObjectURL(url);
      } catch (e2) {
        alert('Failed to generate PDF. Please try again.');
        console.error(e2);
      } finally {
        setGenerating(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 p-6 report-container">
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
          <p className="text-sm text-muted-foreground">No attacks tell entries for selected sensor.</p>
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
}
