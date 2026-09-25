'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CONGESTION_COLORS } from '@/lib/congestion';

interface TrafficLegendProps {
  className?: string;
  horizontal?: boolean;
}

export function TrafficLegend({ className, horizontal = true }: TrafficLegendProps) {
  const levels = [
    { key: 'LOW', label: 'Free Flow', color: CONGESTION_COLORS.LOW.fill, text: '> 85% speed' },
    { key: 'MODERATE', label: 'Moderate', color: CONGESTION_COLORS.MODERATE.fill, text: '65-85% speed' },
    { key: 'HIGH', label: 'Heavy', color: CONGESTION_COLORS.HIGH.fill, text: '40-65% speed' },
    { key: 'SEVERE', label: 'Severe', color: CONGESTION_COLORS.SEVERE.fill, text: '< 40% speed' },
  ] as const;

  return (
    <div
      className={cn(
        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-md text-xs select-none",
        horizontal ? "flex items-center gap-4 flex-wrap" : "space-y-2",
        className
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Flow Index
      </span>
      {levels.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
