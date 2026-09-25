'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Car, 
  AlertTriangle, 
  Cloud, 
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { DashboardMetricCard } from '@/components/dashboard/metric-card';
import { TrafficOverview } from '@/components/dashboard/traffic-overview';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { TrafficSummary } from '@/components/dashboard/traffic-summary';
import { TrafficTrendWidget } from '@/components/dashboard/traffic-trend-widget';
import { PredictionSummary } from '@/components/dashboard/prediction-summary';
import { WeatherWidget } from '@/components/dashboard/weather-widget';

import { 
  getAnalytics, 
  getTrafficData, 
  getIncidents, 
  getWeather, 
  getAlerts,
  getPredictions 
} from '@/lib/api/client';
import type { 
  AnalyticsData, 
  TrafficSegment, 
  Incident, 
  Alert, 
  WeatherData,
  TrafficPrediction 
} from '@/types';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

export default function DashboardPage() {
  // Query live/demo backend endpoints
  const { 
    data: analyticsRes, 
    isLoading: loadingAnalytics, 
    refetch: refetchAnalytics,
    isRefetching: refetchingAnalytics 
  } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
    refetchInterval: 60000,
  });

  const { 
    data: trafficRes, 
    isLoading: loadingTraffic, 
    refetch: refetchTraffic 
  } = useQuery({
    queryKey: ['trafficSegments'],
    queryFn: getTrafficData,
    refetchInterval: 60000,
  });

  const { 
    data: incidentsRes, 
    isLoading: loadingIncidents, 
    refetch: refetchIncidents 
  } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => getIncidents(),
    refetchInterval: 60000,
  });

  const { 
    data: weatherRes, 
    isLoading: loadingWeather, 
    refetch: refetchWeather 
  } = useQuery({
    queryKey: ['weather'],
    queryFn: getWeather,
    refetchInterval: 300000,
  });

  const { 
    data: alertsRes, 
    isLoading: loadingAlerts, 
    refetch: refetchAlerts 
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 60000,
  });

  const { 
    data: predictionsRes, 
    isLoading: loadingPredictions, 
    refetch: refetchPredictions 
  } = useQuery({
    queryKey: ['predictions', 30],
    queryFn: () => getPredictions(30),
    refetchInterval: 120000,
  });

  const analytics = analyticsRes?.data as AnalyticsData | undefined;
  const segments = (trafficRes?.data ?? []) as TrafficSegment[];
  const incidents = (incidentsRes?.data ?? []) as Incident[];
  const weather = weatherRes?.data as WeatherData | undefined;
  const alerts = (alertsRes?.data ?? []) as Alert[];
  const predictions = (predictionsRes?.data ?? []) as TrafficPrediction[];

  const dataMode = analyticsRes?.data_mode || trafficRes?.data_mode || 'demo';

  const handleRefreshAll = () => {
    refetchAnalytics();
    refetchTraffic();
    refetchIncidents();
    refetchWeather();
    refetchAlerts();
    refetchPredictions();
  };

  // Congestion status colors
  const congestionLevel = analytics?.overall_level || 'LOW';
  const colorInfo = CONGESTION_COLORS[congestionLevel] || CONGESTION_COLORS.LOW;
  const congestionPct = Math.round((analytics?.overall_congestion || 0) * 100);
  const criticalIncidentsCount = incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;

  return (
    <PageContainer
      title="Traffic Intelligence"
      subtitle="Real-time traffic conditions, predictions and incidents across Bangalore."
      dataMode={dataMode}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refetchingAnalytics}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refetchingAnalytics ? 'animate-spin' : ''}`} />
            <span>Sync Grid</span>
          </Button>
        </div>
      }
    >
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overall Congestion */}
        <DashboardMetricCard
          title="Overall Congestion"
          value={loadingAnalytics ? "--" : `${congestionPct}%`}
          subtitle={`${analytics?.total_segments || 25} monitored corridors`}
          icon={Activity}
          iconColor="text-blue-600 dark:text-blue-400"
          badgeText={getCongestionLabel(congestionLevel)}
          badgeClassName={`${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
          trend={{
            value: congestionPct > 60 ? "+4.2%" : "-2.1%",
            isGood: congestionPct <= 50,
            label: "vs normal",
          }}
        />

        {/* KPI 2: Active Incidents */}
        <DashboardMetricCard
          title="Active Incidents"
          value={loadingIncidents ? "--" : incidents.length}
          subtitle={
            criticalIncidentsCount > 0
              ? `${criticalIncidentsCount} critical / major delay`
              : "No critical obstructions"
          }
          icon={AlertTriangle}
          iconColor={criticalIncidentsCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}
          badgeText={criticalIncidentsCount > 0 ? "ATTENTION" : "MONITORED"}
          badgeClassName={criticalIncidentsCount > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-700 border-slate-200"}
        />

        {/* KPI 3: Average Speed */}
        <DashboardMetricCard
          title="Average Speed"
          value={loadingAnalytics ? "--" : `${Math.round(analytics?.avg_speed || 0)} km/h`}
          subtitle="Typical free-flow: 45 km/h"
          icon={Car}
          iconColor="text-emerald-600 dark:text-emerald-400"
          badgeText={`${Math.max(0, 45 - Math.round(analytics?.avg_speed || 0))} km/h drag`}
          badgeClassName="bg-slate-100 text-slate-700 border-slate-200"
          trend={{
            value: `${Math.round((analytics?.avg_speed || 0) / 45 * 100)}%`,
            isGood: (analytics?.avg_speed || 0) > 30,
            label: "capacity",
          }}
        />

        {/* KPI 4: Weather Conditions */}
        <DashboardMetricCard
          title="Weather Context"
          value={loadingWeather ? "--" : `${Math.round(weather?.temperature || 26)}°C`}
          subtitle={weather ? `${weather.condition} • ${weather.humidity}% humidity` : "Bangalore microclimate"}
          icon={Cloud}
          iconColor="text-sky-600 dark:text-sky-400"
          badgeText={weather?.precipitation && weather.precipitation > 0 ? "WET ROADS" : "CLEAR"}
          badgeClassName={weather?.precipitation && weather.precipitation > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}
        />
      </div>

      {/* Main Content Grid: Live Map Overview (LEFT) + Recent Alerts (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <TrafficOverview
            segments={segments}
            isLoading={loadingTraffic}
            dataMode={dataMode}
          />
        </div>
        <div className="lg:col-span-5">
          <RecentAlerts
            alerts={alerts}
            isLoading={loadingAlerts}
          />
        </div>
      </div>

      {/* Secondary Content: Top Congested Roads + 24h Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <TrafficSummary
            roads={analytics?.top_congested_roads ?? []}
            isLoading={loadingAnalytics}
          />
        </div>
        <div className="lg:col-span-6">
          <TrafficTrendWidget
            data={analytics?.hourly_patterns ?? []}
            isLoading={loadingAnalytics}
          />
        </div>
      </div>

      {/* Tertiary Content: ML Prediction Summary + Bangalore Weather & Road Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <PredictionSummary
            predictions={predictions}
            isLoading={loadingPredictions}
          />
        </div>
        <div className="lg:col-span-5">
          <WeatherWidget
            weather={weather}
            isLoading={loadingWeather}
          />
        </div>
      </div>
    </PageContainer>
  );
}
