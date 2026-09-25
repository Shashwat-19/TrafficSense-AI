'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '@/lib/api/client';
import type { Alert, AlertSeverityType } from '@/types';
import { PageContainer } from '@/components/layout/page-container';
import { AlertCard } from '@/components/alerts/alert-card';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  CheckCheck, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';

export default function AlertsPage() {
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlertSeverityType>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: res, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 60000,
  });

  const alerts = (res?.data ?? []) as Alert[];
  const dataMode = res?.data_mode || 'demo';

  const toggleRead = (id: string) => {
    setReadAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadAlerts(new Set(alerts.map((a) => a.id)));
  };

  const unreadCount = alerts.filter((a) => !readAlerts.has(a.id)).length;

  const filtered = alerts.filter((alert) => {
    const isRead = readAlerts.has(alert.id);
    if (unreadOnly && isRead) return false;
    if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
    return true;
  });

  return (
    <PageContainer
      title="Intelligent Alert Center"
      subtitle="Automated alerts for severe congestion surges, road incidents, and weather risks."
      dataMode={dataMode}
      actions={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Mark All Read</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Check Now</span>
          </Button>
        </div>
      }
    >
      {/* Alert Center Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1">Severity:</span>
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                severityFilter === sev
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {sev === 'ALL' ? 'All Alerts' : sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Unread Only ({unreadCount})</span>
          </label>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Unable to Load Alerts</h3>
            <p className="text-xs text-slate-500 text-center max-w-sm">
              Please check backend connection.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-emerald-500 stroke-1" />
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No active alerts matching criteria</h4>
          <p className="text-xs text-slate-500 mt-1">Normal baseline traffic across Bangalore corridors.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 px-1 font-medium flex items-center justify-between">
            <span>Showing {filtered.length} alert{filtered.length !== 1 ? 's' : ''}</span>
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 text-white font-semibold text-xs px-2 py-0.5">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              isRead={readAlerts.has(alert.id)}
              onToggleRead={toggleRead}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
