'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Car, Cloud, Activity, Clock, ShieldAlert } from 'lucide-react';
import { getAnalytics, getIncidents, getWeather, getAlerts } from '@/lib/api/client';
import type { AppResponse, AnalyticsData, Incident, Alert, WeatherData } from '@/types';
import { CONGESTION_COLORS } from '@/lib/congestion';
import type { CongestionLevel } from '@/types';

function getCongestionColor(level: string) {
  const colors = CONGESTION_COLORS[level as CongestionLevel];
  if (!colors) return 'text-gray-500 bg-gray-500/10';
  return `${colors.text} ${colors.bg}`;
}

export default function DashboardPage() {
  const { data: analyticsRes, isLoading: loadingAnalytics, error: errorAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
    refetchInterval: 60000,
  });

  const { data: incidentsRes, isLoading: loadingIncidents, error: errorIncidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => getIncidents(),
    refetchInterval: 60000,
  });

  const { data: weatherRes, isLoading: loadingWeather, error: errorWeather } = useQuery({
    queryKey: ['weather'],
    queryFn: getWeather,
    refetchInterval: 300000,
  });

  const { data: alertsRes, isLoading: loadingAlerts, error: errorAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 60000,
  });

  const analytics = analyticsRes?.data as AnalyticsData | undefined;
  const incidents = (incidentsRes?.data ?? []) as Incident[];
  const weather = weatherRes?.data as WeatherData | undefined;
  const alerts = (alertsRes?.data ?? []) as Alert[];
  const dataMode = analyticsRes?.data_mode || 'demo';

  return (
    <div className="flex-1 space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Badge variant="outline" className={dataMode === 'live' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}>
          {dataMode === 'live' ? '● LIVE' : '● DEMO'}
        </Badge>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Congestion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? <Skeleton className="h-7 w-20" /> : errorAnalytics ? (
              <div className="text-sm text-red-500">Error</div>
            ) : (
              <>
                <Badge className={getCongestionColor(analytics?.overall_level || 'LOW')}>
                  {analytics?.overall_level || 'UNKNOWN'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {((analytics?.overall_congestion || 0) * 100).toFixed(0)}% congested
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingIncidents ? <Skeleton className="h-7 w-20" /> : errorIncidents ? (
              <div className="text-sm text-red-500">Error</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{incidents.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Across Bangalore</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? <Skeleton className="h-7 w-20" /> : errorAnalytics ? (
              <div className="text-sm text-red-500">Error</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{Math.round(analytics?.avg_speed || 0)} km/h</div>
                <p className="text-xs text-muted-foreground mt-1">{analytics?.total_segments || 0} segments monitored</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weather</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingWeather ? <Skeleton className="h-7 w-20" /> : errorWeather ? (
              <div className="text-sm text-red-500">Error</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{weather?.temperature || '--'}°C</div>
                <p className="text-xs text-muted-foreground mt-1">{weather?.condition || 'Loading...'} • {weather?.humidity || 0}% humidity</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traffic Overview + Recent Alerts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : errorAnalytics ? (
              <div className="text-red-500">Failed to load traffic overview</div>
            ) : (
              <div className="space-y-4">
                {analytics?.top_congested_roads?.slice(0, 5).map((road, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{road.road_name}</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {road.current_speed} km/h (free: {road.free_flow_speed} km/h)
                      </span>
                    </div>
                    <Badge className={getCongestionColor(road.congestion_level)}>
                      {road.congestion_level}
                    </Badge>
                  </div>
                ))}
                {(!analytics?.top_congested_roads || analytics.top_congested_roads.length === 0) && (
                  <div className="text-sm text-muted-foreground">No congestion data available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAlerts ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : errorAlerts ? (
              <div className="text-red-500">Failed to load alerts</div>
            ) : (
              <div className="space-y-4">
                {alerts.slice(0, 5).map((alert, i) => (
                  <div key={i} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className="mt-1">
                      <ShieldAlert className={`h-5 w-5 ${alert.severity === 'CRITICAL' ? 'text-red-500' : alert.severity === 'WARNING' ? 'text-orange-500' : 'text-blue-500'}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.road_name || 'Bangalore'}</p>
                    </div>
                    <Badge variant="outline">{alert.severity}</Badge>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="text-sm text-muted-foreground">No recent alerts</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
