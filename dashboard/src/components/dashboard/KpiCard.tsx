import { ReactNode } from 'react';
import CountUp from 'react-countup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  loading?: boolean;
  sparkline?: ReactNode;
  sparklineData?: Array<{ value: number }>;
}

export function KpiCard({ title, value, icon: Icon, trend, loading, sparkline, sparklineData }: KpiCardProps) {
  if (loading) {
    return (
      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          {sparkline && <Skeleton className="h-12 w-full" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-2">
          <CountUp end={value} duration={1} separator="," />
        </div>
        {trend !== undefined && (
          <p className="text-xs text-muted-foreground">
            {trend > 0 ? '+' : ''}
            {trend}% from last period
          </p>
        )}
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-12 mt-2 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {sparkline && <div className="mt-4">{sparkline}</div>}
      </CardContent>
    </Card>
  );
}
