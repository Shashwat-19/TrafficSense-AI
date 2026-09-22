'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRoutes } from '@/lib/api/client';
import type { RouteResponse, RouteAlternative, CongestionLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, Clock, AlertTriangle, Route } from 'lucide-react';
import { CONGESTION_COLORS } from '@/lib/congestion';

const PRESETS = [
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'Electronic City', lat: 12.8458, lng: 77.6602 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'MG Road', lat: 12.9757, lng: 77.6062 },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: 'Hebbal', lat: 13.0358, lng: 77.5970 },
  { name: 'Silk Board', lat: 12.9177, lng: 77.6238 },
  { name: 'Airport', lat: 13.1986, lng: 77.7066 },
  { name: 'Majestic', lat: 12.9767, lng: 77.5713 },
  { name: 'Jayanagar', lat: 12.9250, lng: 77.5830 },
];

function getCColor(level: string) {
  const c = CONGESTION_COLORS[level as CongestionLevel];
  return c ? `${c.text} ${c.bg}` : 'text-gray-500 bg-gray-500/10';
}

function formatTime(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function RoutesPage() {
  const [originPreset, setOriginPreset] = useState('');
  const [destPreset, setDestPreset] = useState('');
  const [avoidCongestion, setAvoidCongestion] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);

  const originLoc = PRESETS.find(p => p.name === originPreset);
  const destLoc = PRESETS.find(p => p.name === destPreset);

  const { data: routeRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['routes', originPreset, destPreset, avoidCongestion],
    queryFn: () => getRoutes(originLoc!.lat, originLoc!.lng, destLoc!.lat, destLoc!.lng, avoidCongestion),
    enabled: searchEnabled && !!originLoc && !!destLoc,
  });

  const routeData = routeRes?.data as RouteResponse | undefined;
  const alternatives = routeData?.alternatives ?? [];

  const handleSearch = () => {
    if (originLoc && destLoc) {
      setSearchEnabled(true);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Route className="h-8 w-8" /> Route Planner
      </h1>

      {/* Input Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" /> Origin
              </label>
              <Select value={originPreset} onValueChange={(v) => { setOriginPreset(v ?? ''); setSearchEnabled(false); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin" />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.filter(p => p.name !== destPreset).map(p => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {originLoc && <p className="text-xs text-muted-foreground">{originLoc.lat}, {originLoc.lng}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" /> Destination
              </label>
              <Select value={destPreset} onValueChange={(v) => { setDestPreset(v ?? ''); setSearchEnabled(false); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.filter(p => p.name !== originPreset).map(p => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {destLoc && <p className="text-xs text-muted-foreground">{destLoc.lat}, {destLoc.lng}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={avoidCongestion} onChange={e => { setAvoidCongestion(e.target.checked); setSearchEnabled(false); }} className="rounded" />
              Avoid high congestion
            </label>
            <Button onClick={handleSearch} disabled={!originLoc || !destLoc || isLoading}>
              <Navigation className="h-4 w-4 mr-2" />
              Find Routes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      )}

      {isError && (
        <Card className="border-red-200">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p>Failed to calculate routes. Check backend.</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {alternatives.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{alternatives.length} Route{alternatives.length > 1 ? 's' : ''} Found</h2>
          {alternatives.map((route, idx) => (
            <Card key={route.id} className={idx === 0 ? 'border-blue-200 shadow-md' : ''}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{route.name}</h3>
                      {idx === 0 && <Badge className="bg-blue-500 text-white">Recommended</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{route.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="font-semibold">{route.distance_km.toFixed(1)} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Travel Time</p>
                      <p className="font-semibold flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" /> {formatTime(route.travel_time_seconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Delay</p>
                      <p className="font-semibold text-orange-500">{formatTime(route.delay_seconds)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Congestion</p>
                      <Badge className={getCColor(route.congestion_level)}>{route.congestion_level}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchEnabled && !isLoading && !isError && alternatives.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No routes found. Try different locations.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
