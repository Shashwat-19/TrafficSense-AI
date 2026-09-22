'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '@/lib/api/client';
import type { Alert } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, CloudRain, Route, TrendingUp, ShieldAlert, Check } from 'lucide-react';

const ALERT_ICONS: Record<string, React.ElementType> = {
  SEVERE_CONGESTION: AlertTriangle,
  MAJOR_INCIDENT: ShieldAlert,
  ROUTE_DELAY: Route,
  TRAFFIC_INCREASE: TrendingUp,
  WEATHER_RISK: CloudRain,
};

const SEVERITY_STYLES: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-700 border-blue-200',
  WARNING: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsPage() {
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());

  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 60000,
  });

  const alerts = (res?.data ?? []) as Alert[];

  const toggleRead = (id: string) => {
    setReadAlerts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const unreadCount = alerts.filter(a => !readAlerts.has(a.id)).length;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-8 w-8" /> Alerts
        </h1>
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white">{unreadCount} unread</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : error ? (
        <Card className="border-red-200">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p>Failed to load alerts</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No active alerts</p>
            <p className="text-sm">Everything looks clear in Bangalore</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = ALERT_ICONS[alert.type] || Bell;
            const isRead = readAlerts.has(alert.id);
            return (
              <Card key={alert.id} className={`transition-opacity ${isRead ? 'opacity-60' : ''}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-100' : alert.severity === 'WARNING' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                      <Icon className={`h-5 w-5 ${alert.severity === 'CRITICAL' ? 'text-red-600' : alert.severity === 'WARNING' ? 'text-orange-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{alert.title}</span>
                        <Badge className={SEVERITY_STYLES[alert.severity] || ''}>{alert.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {alert.road_name && <span>📍 {alert.road_name}</span>}
                        <span>🕐 {timeAgo(alert.created_at)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRead(alert.id)}
                      className="text-xs"
                    >
                      {isRead ? 'Unread' : <><Check className="h-3 w-3 mr-1" /> Read</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
