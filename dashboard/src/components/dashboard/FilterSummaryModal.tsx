import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type FilterSummary = {
  sensors: string;
  protocols: string;
  countries: string;
  eventTypes: string;
  ip: string;
  user: string;
  pass: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterSummary: FilterSummary;
  timeRange: { from: string; to: string };
  onDownload: () => void;
};

export function FilterSummaryModal({ open, onOpenChange, filterSummary, timeRange, onDownload }: Props) {
  const headline = `Generating report for ${new Date(timeRange.from).toLocaleString()} → ${new Date(timeRange.to).toLocaleString()}`;
  const blurb = `Sensors: ${filterSummary.sensors} • Protocols: ${filterSummary.protocols} • Countries: ${filterSummary.countries} • Event Types: ${filterSummary.eventTypes}`;
  const advanced = `IP: ${filterSummary.ip} • Username: ${filterSummary.user} • Password: ${filterSummary.pass}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Summary</DialogTitle>
          <DialogDescription>Review applied filters before generating your PDF.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium">{headline}</div>
            <div className="text-sm text-muted-foreground mt-1">{blurb}</div>
            <div className="text-sm text-muted-foreground">{advanced}</div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Sensors</div>
              <div className="text-sm font-medium">{filterSummary.sensors}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Protocols</div>
              <div className="text-sm font-medium">{filterSummary.protocols}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Countries</div>
              <div className="text-sm font-medium">{filterSummary.countries}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Event Types</div>
              <div className="text-sm font-medium">{filterSummary.eventTypes}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">IP</div>
              <div className="text-sm font-medium">{filterSummary.ip}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Username</div>
              <div className="text-sm font-medium">{filterSummary.user}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Password</div>
              <div className="text-sm font-medium">{filterSummary.pass}</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>View Full Report</Button>
          <Button onClick={onDownload}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

