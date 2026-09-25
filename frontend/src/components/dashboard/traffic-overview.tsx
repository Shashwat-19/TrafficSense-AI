'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, ArrowUpRight } from 'lucide-react';
import type { TrafficSegment } from '@/types';

// Dynamically import Leaflet mini preview with SSR disabled
const DashboardMapPreview = dynamic(
  () => import('./dashboard-map-preview'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    ),
  }
);

interface TrafficOverviewProps {
  segments: TrafficSegment[];
  isLoading: boolean;
  dataMode?: 'live' | 'demo';
}

export function TrafficOverview({ segments, isLoading }: TrafficOverviewProps) {
  // Compute summary stats
  const severeCount = segments.filter(s => s.congestion_level === 'SEVERE').length;
  const highCount = segments.filter(s => s.congestion_level === 'HIGH').length;

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Live Traffic Overview
            </CardTitle>
            <Badge variant="outline" className="text-[10px] px-2 py-0 border-slate-200 text-slate-500 font-medium">
              Bangalore Grid
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time arterial flow across {segments.length || 25} monitored road segments.
          </p>
        </div>

        <Link href="/map">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <span>Explore Map</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        {/* Map Preview Container */}
        <div className="w-full h-[320px] rounded-xl overflow-hidden border border-slate-200/70 dark:border-slate-700/60 relative">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <DashboardMapPreview segments={segments} />
          )}

          {/* Floating mini legend */}
          <div className="absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Free
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> Heavy
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Severe
            </span>
          </div>
        </div>

        {/* Quick status bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Corridors</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{segments.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-center">
            <span className="text-rose-600 dark:text-rose-400 block text-[10px] uppercase font-semibold">Severe Spots</span>
            <span className="font-bold text-rose-700 dark:text-rose-300 text-sm">{severeCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 text-center">
            <span className="text-orange-600 dark:text-orange-400 block text-[10px] uppercase font-semibold">Heavy Bottlenecks</span>
            <span className="font-bold text-orange-700 dark:text-orange-300 text-sm">{highCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Coverage</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">100% BLR</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
