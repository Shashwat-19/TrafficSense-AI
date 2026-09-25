'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  AlertTriangle, 
  CloudRain, 
  Route, 
  TrendingUp, 
  ShieldAlert, 
  Check, 
  MapPin, 
  Clock,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import type { Alert, AlertSeverityType } from '@/types';
import { formatTimestamp } from '@/lib/congestion';

const ALERT_ICONS: Record<string, React.ElementType> = {
  SEVERE_CONGESTION: AlertTriangle,
  MAJOR_INCIDENT: ShieldAlert,
  ROUTE_DELAY: Route,
  TRAFFIC_INCREASE: TrendingUp,
  WEATHER_RISK: CloudRain,
};

const SEVERITY_STYLES: Record<AlertSeverityType, { text: string; bg: string; border: string; iconColor: string }> = {
  CRITICAL: {
    text: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900',
    iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  WARNING: {
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
    iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  INFO: {
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-900',
    iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
  },
};

interface AlertCardProps {
  alert: Alert;
  isRead: boolean;
  onToggleRead: (id: string) => void;
}

export function AlertCard({ alert, isRead, onToggleRead }: AlertCardProps) {
  const Icon = ALERT_ICONS[alert.type] || Bell;
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.INFO;

  return (
    <Card className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
      isRead
        ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 opacity-70'
        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md'
    }`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Severity Icon */}
          <div className={`p-3 rounded-xl border shrink-0 ${style.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                {!isRead && (
                  <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                )}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {alert.title}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${style.border} ${style.bg} ${style.text}`}
                >
                  {alert.severity}
                </Badge>
              </div>

              <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0" suppressHydrationWarning>
                <Clock className="h-3 w-3" />
                {formatTimestamp(alert.created_at)}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {alert.message}
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              {alert.road_name ? (
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{alert.road_name}</span>
                </span>
              ) : (
                <span className="text-slate-400 text-xs">Bangalore Metropolitan Area</span>
              )}

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {alert.road_name && (
                  <Link
                    href={`/map?road=${encodeURIComponent(alert.road_name)}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-xs flex items-center gap-1"
                  >
                    <span>View Map</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}

                <Link
                  href={`/chat?prompt=${encodeURIComponent(`Explain this alert for Bangalore: ${alert.title}. ${alert.message}`)}`}
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
                  title="Ask AI"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleRead(alert.id)}
                  className="h-7 px-2.5 text-xs text-slate-500 hover:text-slate-900 rounded-lg"
                >
                  {isRead ? 'Mark Unread' : <><Check className="h-3 w-3 mr-1" /> Mark Read</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
