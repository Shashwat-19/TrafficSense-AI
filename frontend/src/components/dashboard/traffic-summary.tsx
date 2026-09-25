'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Gauge, ArrowRight } from 'lucide-react';
import type { TopCongestedRoad } from '@/types';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

interface TrafficSummaryProps {
  roads: TopCongestedRoad[];
  isLoading: boolean;
}

export function TrafficSummary({ roads, isLoading }: TrafficSummaryProps) {
  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Top Congested Roads
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key Bangalore choke points ranked by congestion index.
          </p>
        </div>

        <Link
          href="/analytics"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>All Corridors</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : roads.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No congestion data available
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {roads.slice(0, 6).map((road, idx) => {
              const colorInfo = CONGESTION_COLORS[road.congestion_level] || CONGESTION_COLORS.LOW;
              const ratioPct = Math.round(road.congestion_ratio * 100);

              return (
                <div
                  key={road.road_name}
                  className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <span className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-500 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/map?road=${encodeURIComponent(road.road_name)}`}
                          className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                        >
                          {road.road_name}
                        </Link>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 rounded-full font-semibold border ${colorInfo.border} ${colorInfo.bg} ${colorInfo.text}`}
                        >
                          {getCongestionLabel(road.congestion_level)}
                        </Badge>
                      </div>

                      {/* Visual progress bar of congestion ratio */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden max-w-md">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(5, ratioPct))}%`,
                            backgroundColor: colorInfo.fill,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0 pl-9 sm:pl-0">
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {Math.round(road.current_speed)} km/h
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        free: {Math.round(road.free_flow_speed)} km/h
                      </span>
                    </div>

                    <div className="w-14 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {ratioPct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
