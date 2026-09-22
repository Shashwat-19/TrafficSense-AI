'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserPreferences, healthCheck } from '@/lib/api/client';
import type { UserPreferences } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Settings, MapPin, Route, Heart, Bell, Server } from 'lucide-react';

export default function SettingsPage() {
  const { data: prefsRes, isLoading: loadingPrefs } = useQuery({
    queryKey: ['preferences'],
    queryFn: getUserPreferences,
  });

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['health'],
    queryFn: healthCheck,
    refetchInterval: 30000,
  });

  const prefs = prefsRes?.data as UserPreferences | undefined;

  return (
    <div className="space-y-6 pt-2 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Settings className="h-8 w-8" /> Settings
      </h1>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" /> API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHealth ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">{health?.status === 'healthy' ? 'Backend Connected' : 'Backend Offline'}</span>
              <Badge variant="outline" className="ml-auto">
                {prefsRes?.data_mode === 'live' ? '● LIVE' : '● DEMO'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      {loadingPrefs ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : prefs ? (
        <>
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Notifications enabled</span>
                <Badge variant={prefs.notifications_enabled ? 'default' : 'secondary'}>
                  {prefs.notifications_enabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Saved Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Saved Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prefs.saved_locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved locations</p>
              ) : (
                <div className="space-y-3">
                  {prefs.saved_locations.map(loc => (
                    <div key={loc.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{loc.name}</span>
                        <p className="text-xs text-muted-foreground">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
                      </div>
                      <Badge variant="outline">{loc.label}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Routes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" /> Recent Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prefs.recent_routes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent routes</p>
              ) : (
                <div className="space-y-3">
                  {prefs.recent_routes.map(route => (
                    <div key={route.id} className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span>{route.origin_name}</span>
                      <span className="text-muted-foreground">→</span>
                      <MapPin className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <span>{route.destination_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorite Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" /> Favorite Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {prefs.favorite_areas.map(area => (
                  <Badge key={area} variant="secondary">{area}</Badge>
                ))}
                {prefs.favorite_areas.length === 0 && (
                  <p className="text-sm text-muted-foreground">No favorite areas</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Units</span>
                <span className="font-medium">{prefs.preferred_units}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Default Map Center</span>
                <span className="font-medium">{prefs.default_map_center_lat}, {prefs.default_map_center_lng}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Default Zoom</span>
                <span className="font-medium">{prefs.default_map_zoom}</span>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
