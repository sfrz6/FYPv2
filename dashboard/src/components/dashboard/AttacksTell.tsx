import { useMemo, useState } from 'react';
import cowrieRaw from '@/data/attacktell/cowrieattacktell.ndjson?raw';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useFilters } from '@/context/FiltersContext';

type AttackTell = {
  attack_id: string;
  summary: string;
  more_details: string;
};

const SENSOR_SOURCES: Record<string, string> = {
  cowrie: cowrieRaw,
};

function parseNdjson(raw: string): AttackTell[] {
  return raw
    .trim()
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l));
}

function formatIdTimestamp(id: string): string {
  const m = id.match(/-(\d{14})$/);
  if (!m) return '';
  const s = m[1];
  const year = s.slice(0, 4);
  const month = s.slice(4, 6);
  const day = s.slice(6, 8);
  const hour = s.slice(8, 10);
  const minute = s.slice(10, 12);
  const second = s.slice(12, 14);
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

interface AttacksTellProps {
  limit?: number;
}

export function AttacksTell({ limit }: AttacksTellProps) {
  const [sensor, setSensor] = useState<string>('cowrie');
  const { filters } = useFilters();

  const attacks = useMemo(() => {
    const raw = SENSOR_SOURCES[sensor];
    if (!raw) return [];
    const all = parseNdjson(raw);
    const ordered = all.slice().reverse();
    return typeof limit === 'number' ? ordered.slice(0, limit) : ordered;
  }, [sensor]);

  const showByContext = useMemo(() => {
    const selected = filters.sensors[0] || 'all';
    return selected === 'all' || selected === 'cowrie';
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attacks tell</h3>
        <Select value={sensor} onValueChange={setSensor}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select sensor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cowrie">Cowrie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showByContext && (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {attacks.map((a) => (
          <Card key={a.attack_id} className="card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">{a.attack_id}</CardTitle>
                  <div className="text-xs text-muted-foreground">{formatIdTimestamp(a.attack_id)}</div>
                </div>
                <div className="text-xs rounded-lg bg-primary/10 px-2 py-1 text-primary">{sensor}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm mb-4 whitespace-pre-wrap">{a.summary}</div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="">More details</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{a.attack_id}</DialogTitle>
                    <DialogDescription>{formatIdTimestamp(a.attack_id)}</DialogDescription>
                  </DialogHeader>
                  <div className="text-sm whitespace-pre-wrap">{a.more_details}</div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
