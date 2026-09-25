'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BellRing, 
  ArrowUpRight, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  MapPin, 
  Clock 
} from 'lucide-react';
import type { Alert } from '@/types';
import { formatTimestamp } from '@/lib/congestion';

interface RecentAlertsProps {
  alerts: Alert[];
  isLoading: boolean;
}

export function RecentAlerts({ alerts, isLoading }: RecentAlertsProps) {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: ShieldAlert,
          iconClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          iconClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
        };
      default:
        return {
          icon: Info,
          iconClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
        };
    }
  };

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Recent Alerts
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time critical notices for Bangalore traffic operations.
          </p>
        </div>

        <Link href="/alerts">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <span>Alert Center</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <BellRing className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No active alerts</p>
            <p className="text-xs text-slate-400 mt-1">Normal flow across Bangalore corridors</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.slice(0, 4).map((alert) => {
              const { icon: Icon, iconClass, badgeClass } = getSeverityStyle(alert.severity);

              return (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3 group"
                >
                  <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${iconClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {alert.title}
                      </h4>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-full font-semibold border ${badgeClass}`}>
                        {alert.severity}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                      {alert.road_name && (
                        <span className="flex items-center gap-1 truncate text-slate-600 dark:text-slate-300">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{alert.road_name}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 shrink-0 ml-auto" suppressHydrationWarning>
                        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                        {formatTimestamp(alert.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Active Alerts: <strong className="text-slate-800 dark:text-slate-200">{alerts.length}</strong></span>
          <Link href="/alerts" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Manage All Alerts →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
