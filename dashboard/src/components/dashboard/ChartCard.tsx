import { ReactNode } from 'react';
import { Download, FileJson, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
  onExportPNG?: () => void;
}

export function ChartCard({
  title,
  description,
  icon: Icon,
  children,
  onExportCSV,
  onExportJSON,
  onExportPNG,
}: ChartCardProps) {
  const hasExport = onExportCSV || onExportJSON || onExportPNG;

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {hasExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExportCSV && (
                <DropdownMenuItem onClick={onExportCSV}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
              )}
              {onExportJSON && (
                <DropdownMenuItem onClick={onExportJSON}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
              )}
              {onExportPNG && (
                <DropdownMenuItem onClick={onExportPNG}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as PNG
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
