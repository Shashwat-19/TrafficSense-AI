'use client';

import { Clock } from 'lucide-react';
import { formatTimestamp } from '@/lib/congestion';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface LastUpdatedProps {
  timestamp: string;
  className?: string;
}

export function LastUpdated({ timestamp, className }: LastUpdatedProps) {
  const [formatted, setFormatted] = useState<string>(() => {
    return typeof window !== 'undefined' ? formatTimestamp(timestamp) : '';
  });

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setFormatted(formatTimestamp(timestamp));
    }, 60000);
    
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!formatted) return null; // Hydration protection

  return (
    <div className={cn('flex items-center text-xs text-muted-foreground', className)}>
      <Clock className="mr-1.5 h-3 w-3" />
      <span>Updated {formatted}</span>
    </div>
  );
}
