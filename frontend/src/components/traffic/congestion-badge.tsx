import { CongestionLevel } from '@/types';
import { Badge } from '@/components/ui/badge';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';
import { cn } from '@/lib/utils';

interface CongestionBadgeProps {
  level: CongestionLevel;
  className?: string;
}

export function CongestionBadge({ level, className }: CongestionBadgeProps) {
  const colors = CONGESTION_COLORS[level] || CONGESTION_COLORS.MODERATE;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(`${colors.text} ${colors.bg} ${colors.border}`, className)}
    >
      {getCongestionLabel(level)}
    </Badge>
  );
}
