'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { getRoutes } from '@/lib/api/client';
import type { RouteResponse } from '@/types';
import { PageContainer } from '@/components/layout/page-container';
import { RouteCard } from '@/components/routes/route-card';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Navigation, 
  ArrowRightLeft, 
  AlertTriangle 
} from 'lucide-react';

const PRESETS = [
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245, area: 'South-East Hub' },
  { name: 'Electronic City', lat: 12.8458, lng: 77.6602, area: 'South Tech Hub' },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500, area: 'East Tech Corridor' },
  { name: 'MG Road', lat: 12.9757, lng: 77.6062, area: 'Central Business District' },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, area: 'East Corridor' },
  { name: 'Hebbal', lat: 13.0358, lng: 77.5970, area: 'North Gateway' },
  { name: 'Silk Board Junction', lat: 12.9177, lng: 77.6238, area: 'South Transit Node' },
  { name: 'Kempegowda Airport (BLR)', lat: 13.1986, lng: 77.7066, area: 'North Aerotropolis' },
  { name: 'Majestic (KSR)', lat: 12.9767, lng: 77.5713, area: 'Central Rail/Bus Terminus' },
  { name: 'Jayanagar', lat: 12.9250, lng: 77.5830, area: 'South BLR' },
];

const DynamicRouteMapPreview = dynamic(
  () => import('@/components/routes/route-map-preview'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-2xl" />
      </div>
    ),
  }
);

export default function RoutesPage() {
  const [originPreset, setOriginPreset] = useState('Koramangala');
  const [destPreset, setDestPreset] = useState('Whitefield');
  const [avoidCongestion, setAvoidCongestion] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();
  const [searchEnabled, setSearchEnabled] = useState(true);

  const originLoc = PRESETS.find(p => p.name === originPreset) || PRESETS[0];
  const destLoc = PRESETS.find(p => p.name === destPreset) || PRESETS[2];

  const { data: routeRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['routes', originPreset, destPreset, avoidCongestion],
    queryFn: () => getRoutes(originLoc.lat, originLoc.lng, destLoc.lat, destLoc.lng, avoidCongestion),
    enabled: searchEnabled && !!originLoc && !!destLoc,
  });

  const routeData = routeRes?.data as RouteResponse | undefined;
  const alternatives = routeData?.alternatives ?? [];
  const dataMode = routeRes?.data_mode || 'demo';

  const handleSwap = () => {
    setOriginPreset(destPreset);
    setDestPreset(originPreset);
    setSearchEnabled(true);
  };

  const handleSearch = () => {
    setSearchEnabled(true);
    refetch();
  };

  return (
    <PageContainer
      title="Route Planner"
      subtitle="Congestion-aware multi-alternative route guidance across Bangalore tech corridors."
      dataMode={dataMode}
    >
      {/* Search & Configuration Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Origin Select */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Origin Point
              </label>
              <Select value={originPreset} onValueChange={(v) => { if (v) setOriginPreset(v); }}>
                <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <SelectValue placeholder="Select origin" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {PRESETS.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({p.area})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-2 flex justify-center pt-2 md:pt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Swap origin and destination"
              >
                <ArrowRightLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </Button>
            </div>

            {/* Destination Select */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Destination Point
              </label>
              <Select value={destPreset} onValueChange={(v) => { if (v) setDestPreset(v); }}>
                <SelectTrigger className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {PRESETS.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({p.area})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bottom Bar: Options + Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={avoidCongestion}
                onChange={(e) => setAvoidCongestion(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Avoid high-congestion bottlenecks (TrafficSense Smart Routing)</span>
            </label>

            <Button
              onClick={handleSearch}
              disabled={isLoading || originPreset === destPreset}
              className="h-9 px-5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs w-full sm:w-auto"
            >
              <Navigation className="h-3.5 w-3.5 mr-1.5" />
              {isLoading ? 'Calculating...' : 'Find Routes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Card className="border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Route Calculation Error</h3>
            <p className="text-xs text-slate-500 text-center max-w-sm">
              Unable to compute route alternatives. Check backend routing service.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl mt-2">
              Retry Route Query
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Workspace: Left Route Cards + Right Interactive Route Map */}
      {alternatives.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Alternatives List */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {alternatives.length} Available Alternative{alternatives.length > 1 ? 's' : ''}
              </h3>
              <span className="text-xs text-slate-400">
                Sorted by travel efficiency
              </span>
            </div>

            {alternatives.map((route, idx) => (
              <RouteCard
                key={route.id}
                route={route}
                isRecommended={idx === 0}
                isSelected={selectedRouteId ? selectedRouteId === route.id : idx === 0}
                onSelect={() => setSelectedRouteId(route.id)}
              />
            ))}
          </div>

          {/* Right: Interactive Route Map Preview */}
          <div className="lg:col-span-6 sticky top-20">
            <DynamicRouteMapPreview
              origin={{ name: originLoc.name, lat: originLoc.lat, lng: originLoc.lng }}
              destination={{ name: destLoc.name, lat: destLoc.lat, lng: destLoc.lng }}
              alternatives={alternatives}
              selectedRouteId={selectedRouteId || alternatives[0]?.id}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
