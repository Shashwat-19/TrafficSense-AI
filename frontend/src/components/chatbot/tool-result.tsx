'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Activity } from 'lucide-react';

interface ToolResultProps {
  toolsUsed: string[];
}

export function ToolResult({ toolsUsed }: ToolResultProps) {
  if (!toolsUsed || toolsUsed.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 pb-0.5">
      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <Activity className="h-3 w-3 text-blue-500" /> Real-time tool telemetry:
      </span>
      {toolsUsed.map((tool, idx) => (
        <Badge
          key={idx}
          variant="outline"
          className="text-[10px] font-mono font-medium py-0 px-2 rounded-full border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center gap-1"
        >
          <CheckCircle className="h-2.5 w-2.5 text-blue-500" />
          {tool.replace(/_/g, ' ')}()
        </Badge>
      ))}
    </div>
  );
}
