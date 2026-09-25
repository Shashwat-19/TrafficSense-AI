'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserPreferences, updateUserPreferences, healthCheck } from '@/lib/api/client';
import type { UserPreferences } from '@/types';
import { PageContainer } from '@/components/layout/page-container';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Route, 
  Bell, 
  Server, 
  User, 
  Check, 
  RefreshCw 
} from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: prefsRes } = useQuery({
    queryKey: ['preferences'],
    queryFn: getUserPreferences,
  });

  const { data: health, refetch: refetchHealth, isRefetching } = useQuery({
    queryKey: ['health'],
    queryFn: healthCheck,
    refetchInterval: 30000,
  });

  const prefs = prefsRes?.data as UserPreferences | undefined;
  const dataMode = prefsRes?.data_mode || 'demo';

  // Local state for notification toggle & save feedback
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (newPrefs: Partial<UserPreferences>) => updateUserPreferences(newPrefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
  });

  const isNotificationsOn = notificationsEnabled !== null
    ? notificationsEnabled
    : (prefs?.notifications_enabled ?? true);

  const handleToggleNotifications = () => {
    const nextVal = !isNotificationsOn;
    setNotificationsEnabled(nextVal);
    mutation.mutate({ notifications_enabled: nextVal });
  };

  const isHealthy = health?.status === 'healthy';

  return (
    <PageContainer
      title="Settings & System Status"
      subtitle="Configure corridor alerts, notification rules, map layers, and system APIs."
      dataMode={dataMode}
      actions={
        savedSuccess && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-semibold flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Preferences Saved
          </Badge>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile & Settings Sections */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Operator Profile */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Operator Profile & Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Operator Identity</label>
                  <Input
                    defaultValue="Traffic Controller BLR"
                    readOnly
                    className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Command Center</label>
                  <Input
                    defaultValue="Bangalore Metropolitan Regional Operations"
                    readOnly
                    className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Notifications */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                Corridor Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Push Alert Broadcasts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Receive immediate notices for severe congestion and critical road closures.</p>
                </div>

                <Button
                  variant={isNotificationsOn ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleNotifications}
                  className={`h-8 px-3 text-xs font-semibold rounded-xl ${isNotificationsOn ? 'bg-blue-600 text-white' : ''}`}
                >
                  {isNotificationsOn ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Monitored Alert Types</h4>
                <div className="flex flex-wrap gap-2">
                  {['Severe Congestion', 'Major Incident', 'Route Delay', 'Weather Risk'].map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-xs font-medium px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    >
                      ✓ {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Traffic & Map Preferences */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Map & Coordinate Defaults
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Default Map Center</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {prefs?.default_map_center_lat || 12.9716}° N, {prefs?.default_map_center_lng || 77.5946}° E
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Default Zoom Level</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Level {prefs?.default_map_zoom || 13} (Metropolitan Grid)
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Measurement Standard</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                  {prefs?.preferred_units || 'metric'} (km / km/h)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Saved Locations & Recent Routes */}
          {prefs && (
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Route className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Saved Bangalore Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {prefs.saved_locations.length === 0 ? (
                  <p className="text-xs text-slate-400">No saved locations configured.</p>
                ) : (
                  <div className="space-y-2">
                    {prefs.saved_locations.map((loc) => (
                      <div
                        key={loc.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-blue-600" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{loc.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{loc.label}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: System Status & API Infrastructure */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                API Infrastructure
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetchHealth()}
                disabled={isRefetching}
                className="h-7 w-7 text-slate-400 hover:text-slate-700"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">FastAPI Backend</span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {isHealthy ? 'Connected (200 OK)' : 'Offline'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Traffic Data Source</span>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {dataMode === 'live' ? 'TomTom Live API' : 'Synthetic BLR Grid'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">AI Service</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  Amazon Bedrock
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Prediction Engine</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  XGBoost Regressor
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">API Version</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {health?.version || '1.0.0'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  TrafficSense AI Bangalore runs on AWS Cloud architecture with tool-calling capabilities.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
