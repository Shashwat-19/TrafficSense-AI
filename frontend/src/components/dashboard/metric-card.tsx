'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  badgeText?: string;
  badgeVariant?: 'default' | 'outline' | 'secondary';
  badgeClassName?: string;
  trend?: {
    value: string;
    isGood?: boolean;
    label?: string;
  };
  className?: string;
}

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600 dark:text-blue-400',
  badgeText,
  badgeClassName,
  trend,
  className,
}: DashboardMetricCardProps) {
  return (
    <Card className={cn(
      "border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden",
      className
    )}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className={cn("p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </div>
          {badgeText && (
            <Badge className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", badgeClassName)}>
              {badgeText}
            </Badge>
          )}
        </div>

        {(subtitle || trend) && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {trend && (
              <span className={cn(
                "inline-flex items-center font-medium gap-1 shrink-0 ml-auto",
                trend.isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {trend.value}
                {trend.label && <span className="text-slate-400 dark:text-slate-500 font-normal">{trend.label}</span>}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
