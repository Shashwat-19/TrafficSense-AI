import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, description, trend, className }: MetricCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend === 'up' && <span className="text-red-500 mr-1">↑</span>}
            {trend === 'down' && <span className="text-green-500 mr-1">↓</span>}
            {trend === 'stable' && <span className="text-muted-foreground mr-1">→</span>}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
