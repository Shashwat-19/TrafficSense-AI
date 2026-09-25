'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  dataMode?: 'live' | 'demo';
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  title,
  subtitle,
  dataMode,
  actions,
  children,
  className,
}: PageContainerProps) {
  return (
    <div className={cn("space-y-6 pb-12", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {dataMode && (
              <Badge
                variant="outline"
                className={cn(
                  "font-medium text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1.5 transition-colors",
                  dataMode === 'live'
                    ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                    : "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400"
                )}
              >
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full animate-pulse",
                  dataMode === 'live' ? "bg-emerald-500" : "bg-amber-500"
                )} />
                {dataMode === 'live' ? 'LIVE DATA' : 'DEMO MODE'}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-normal leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
