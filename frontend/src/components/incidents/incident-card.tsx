'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Construction, 
  Ban, 
  CarFront, 
  CircleAlert, 
  Cone, 
  HelpCircle, 
  MapPin, 
  Clock, 
  ArrowRight, 
  MessageSquare 
} from 'lucide-react';
import type { Incident, IncidentSeverity } from '@/types';
import { formatTimestamp } from '@/lib/congestion';

const INCIDENT_ICONS: Record<string, React.ElementType> = {
  ACCIDENT: CarFront,
  ROAD_CLOSURE: Ban,
  CONSTRUCTION: Construction,
  CONGESTION: CircleAlert,
  OBSTRUCTION: Cone,
  OTHER: HelpCircle,
};

const SEVERITY_STYLES: Record<IncidentSeverity, { text: string; bg: string; border: string; iconColor: string }> = {
  CRITICAL: {
    text: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900',
    iconColor: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  HIGH: {
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-900',
    iconColor: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  MODERATE: {
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
    iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  LOW: {
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-900',
    iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
  },
};

interface IncidentCardProps {
  incident: Incident;
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const Icon = INCIDENT_ICONS[incident.type] || HelpCircle;
  const style = SEVERITY_STYLES[incident.severity] || SEVERITY_STYLES.LOW;

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs hover:shadow-md transition-all overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Category Icon */}
          <div className={`p-3 rounded-xl border shrink-0 ${style.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                  {incident.type.replace(/_/g, ' ')}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${style.border} ${style.bg} ${style.text}`}
                >
                  {incident.severity} SEVERITY
                </Badge>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1" suppressHydrationWarning>
                <Clock className="h-3 w-3" />
                <span>{formatTimestamp(incident.start_time)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {incident.description}
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              {incident.road_name ? (
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{incident.road_name}</span>
                </span>
              ) : (
                <span className="text-slate-400 text-xs">Bangalore Metropolitan Area</span>
              )}

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Link
                  href={`/map?road=${encodeURIComponent(incident.road_name || '')}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-xs flex items-center gap-1"
                >
                  <span>View on Map</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>

                <Link
                  href={`/chat?prompt=${encodeURIComponent(`What is the status of the ${incident.type.replace(/_/g, ' ')} reported near ${incident.road_name || 'Bangalore'}?`)}`}
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
                  title="Ask AI"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
