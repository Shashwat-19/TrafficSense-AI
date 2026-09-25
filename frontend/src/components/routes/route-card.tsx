'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, ShieldCheck } from 'lucide-react';
import type { RouteAlternative, CongestionLevel } from '@/types';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

interface RouteCardProps {
  route: RouteAlternative;
  isRecommended?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function RouteCard({ route, isRecommended = false, isSelected = false, onSelect }: RouteCardProps) {
  const colorInfo = CONGESTION_COLORS[route.congestion_level as CongestionLevel] || CONGESTION_COLORS.LOW;
  const delayMins = Math.round(route.delay_seconds / 60);

  return (
    <Card
      onClick={onSelect}
      className={`border rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-white dark:bg-slate-900'
          : isRecommended
            ? 'border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-300'
            : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300'
      }`}
    >
      <CardContent className="p-5 space-y-4">
        {/* Route Title & Recommended Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              isRecommended 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                {route.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {route.summary || "Bangalore corridor path"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isRecommended && (
              <Badge className="bg-blue-600 text-white font-semibold text-xs px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Recommended
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorInfo.border} ${colorInfo.bg} ${colorInfo.text}`}
            >
              {getCongestionLabel(route.congestion_level)}
            </Badge>
          </div>
        </div>

        {/* Route Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[11px] mb-0.5">Travel Time</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {formatDuration(route.travel_time_seconds)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[11px] mb-0.5">Distance</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {route.distance_km.toFixed(1)} km
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border text-center ${
            delayMins > 0 
              ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40' 
              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
          }`}>
            <span className={`block text-[11px] mb-0.5 ${delayMins > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              Expected Delay
            </span>
            <span className={`text-base font-bold ${delayMins > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {delayMins > 0 ? `+${delayMins} min` : 'Zero delay'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[11px] mb-0.5">Congestion Ratio</span>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {Math.round(route.congestion_ratio * 100)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
