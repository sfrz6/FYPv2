import { useTISummary } from '@/hooks/useHoneypotData';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Bug } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export default function ThreatIntel() {
  const { data: tiData, isLoading } = useTISummary();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Threat Intelligence
        </h1>
        <p className="text-muted-foreground">
          Analyze malicious activity using AbuseIPDB, VirusTotal, MalwareBazaar, MITRE ATT&CK, and OnionSearch
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Malicious IPs"
          value={tiData?.maliciousIps || 0}
          icon={AlertTriangle}
          loading={isLoading}
        />
        <KpiCard
          title="Avg VT Detections"
          value={tiData?.avgVTDetections || 0}
          icon={Shield}
          loading={isLoading}
        />
        <KpiCard
          title="Malware Families"
          value={tiData?.malwareFamilyCount || 0}
          icon={Bug}
          loading={isLoading}
        />
      </div>

      {/* Top malware uploaded */}
      <ChartCard
        title="Top malware uploaded"
        description="Most frequently detected malware"
        icon={Bug}
      >
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SHA-256</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">VT Score</TableHead>
                  <TableHead>Malware Family</TableHead>
                  <TableHead className="text-right">Darkweb Mention</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiData?.topUploads?.map((u) => (
                  <TableRow key={u.hash}>
                    <TableCell className="font-mono text-xs">
                      <Popover>
                        <PopoverTrigger className="underline decoration-dotted cursor-pointer">
                          {u.hash?.length > 20 ? `${u.hash.slice(0, 20)}…` : u.hash}
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="text-xs font-mono break-all">{u.hash}</div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="font-mono text-xs break-all">{u.url || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{u.detections ?? 0}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.malwareFamily ? (
                        <Badge variant="destructive">{u.malwareFamily}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{u.darkwebMentions ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{u.count}</TableCell>
                  </TableRow>
                ))}
                {(!tiData?.topUploads || tiData.topUploads.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No file downloads detected in this time range
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </ChartCard>

      {/* Top Malicious IPs Table */}
      <ChartCard
        title="Top 10 Malicious IPs"
        description="IPs with AbuseIPDB score ≥ 70 and their threat context"
        icon={AlertTriangle}
      >
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source IP</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead>AbuseIPDB</TableHead>
                  <TableHead>VT Detections</TableHead>
                  <TableHead>Malware</TableHead>
                  <TableHead>MITRE Tactics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiData?.topMaliciousIps?.map((ip) => (
                  <TableRow key={ip.ip}>
                    <TableCell className="font-mono text-sm">{ip.ip}</TableCell>
                    <TableCell className="text-right font-medium">{ip.count}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ip.abuseScore && ip.abuseScore >= 90
                            ? 'destructive'
                            : ip.abuseScore && ip.abuseScore >= 70
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {ip.abuseScore || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ip.vtDetections || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      {ip.malwareFamily ? (
                        <Badge variant="destructive">{ip.malwareFamily}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ip.mitreTactics && ip.mitreTactics.length > 0 ? (
                          ip.mitreTactics.slice(0, 3).map((tactic, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tactic}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!tiData?.topMaliciousIps || tiData.topMaliciousIps.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No malicious IPs detected in this time range
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
