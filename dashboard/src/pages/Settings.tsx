import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFilters } from '@/context/FiltersContext';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const { theme, setTheme, direction, setDirection, adapter } = useFilters();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Configure your Smart Honeypot TI dashboard</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Light Mode</Label>
            <Switch id="theme" checked={theme === 'light'} onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="rtl">RTL Mode (Right-to-Left)</Label>
            <Switch id="rtl" checked={direction === 'rtl'} onCheckedChange={(checked) => setDirection(checked ? 'rtl' : 'ltr')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Source</CardTitle>
          <CardDescription>Current adapter configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Label>Active Adapter:</Label>
            <Badge variant="secondary">{adapter}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Demo mode loads data from local JSON file</p>
        </CardContent>
      </Card>
    </div>
  );
}
