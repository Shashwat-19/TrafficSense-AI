import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DataModeIndicatorProps {
  mode: 'live' | 'demo';
  className?: string;
}

export function DataModeIndicator({ mode, className }: DataModeIndicatorProps) {
  const isLive = mode === 'live';
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium tracking-wide flex items-center gap-2',
        isLive ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {isLive && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={cn(
          "relative inline-flex rounded-full h-2 w-2",
          isLive ? "bg-green-500" : "bg-yellow-500"
        )}></span>
      </span>
      {isLive ? 'LIVE' : 'DEMO'}
    </Badge>
  );
}
