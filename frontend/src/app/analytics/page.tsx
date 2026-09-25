'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/lib/api/client';
import type { AnalyticsData } from '@/types';
import { PageContainer } from '@/components/layout/page-container';
import { DashboardMetricCard } from '@/components/dashboard/metric-card';
import { CongestionDistributionChart } from '@/components/analytics/congestion-distribution-chart';
import { HourlyTrafficChart } from '@/components/analytics/hourly-traffic-chart';
import { CongestedRoadsChart } from '@/components/analytics/congested-roads-chart';
import { SpeedComparisonChart } from '@/components/analytics/speed-comparison-chart';
import { IncidentStatsChart } from '@/components/analytics/incident-stats-chart';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Car, 
  MapPin, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Filter, 
  Clock 
} from 'lucide-react';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [roadFilter, setRoadFilter] = useState('ALL');

  const { data: res, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
    refetchInterval: 60000,
  });

  const analytics = res?.data as AnalyticsData | undefined;
  const dataMode = res?.data_mode || 'demo';

  // Export report as CSV function
  const handleExportCSV = () => {
    if (!analytics) return;

    let csv = "Road Name,Congestion Level,Congestion Ratio %,Current Speed (km/h),Free Flow Speed (km/h)\n";
    analytics.top_congested_roads.forEach(road => {
      csv += `"${road.road_name}",${road.congestion_level},${Math.round(road.congestion_ratio * 100)},${Math.round(road.current_speed)},${Math.round(road.free_flow_speed)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bangalore-traffic-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <PageContainer
        title="Traffic Analytics"
        subtitle="Corridor performance metrics, congestion distribution, and velocity tracking."
      >
        <Card className="border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Failed to retrieve traffic analytics</h3>
            <p className="text-xs text-slate-500 text-center max-w-sm">
              Please verify that the backend API service is running on port 8000.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl mt-2">
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Retry Fetch
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const congestionLevel = analytics?.overall_level || 'LOW';
  const colorInfo = CONGESTION_COLORS[congestionLevel] || CONGESTION_COLORS.LOW;
  const congestionPct = Math.round((analytics?.overall_congestion || 0) * 100);

  // Filter top congested roads if filter applied
  const filteredRoads = (analytics?.top_congested_roads ?? []).filter(r => {
    if (roadFilter === 'ORR') return r.road_name.toLowerCase().includes('ring');
    if (roadFilter === 'TECH') return r.road_name.toLowerCase().includes('whitefield') || r.road_name.toLowerCase().includes('electronic') || r.road_name.toLowerCase().includes('sarjapur');
    return true;
  });

  return (
    <PageContainer
      title="Traffic Analytics"
      subtitle="Corridor performance metrics, congestion distribution, and velocity tracking across Bangalore."
      dataMode={dataMode}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!analytics || isLoading}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      }
    >
      {/* 4 Top KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          title="Overall Congestion"
          value={isLoading ? "--" : `${congestionPct}%`}
          subtitle="Monitored grid capacity"
          icon={Activity}
          iconColor="text-blue-600 dark:text-blue-400"
          badgeText={getCongestionLabel(congestionLevel)}
          badgeClassName={`${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
        />

        <DashboardMetricCard
          title="Average Speed"
          value={isLoading ? "--" : `${Math.round(analytics?.avg_speed || 0)} km/h`}
          subtitle="Citywide velocity metric"
          icon={Car}
          iconColor="text-emerald-600 dark:text-emerald-400"
          badgeText="Baseline 45 km/h"
          badgeClassName="bg-slate-100 text-slate-700 border-slate-200"
        />

        <DashboardMetricCard
          title="Segments Monitored"
          value={isLoading ? "--" : (analytics?.total_segments || 25)}
          subtitle="Arterial Bangalore roads"
          icon={MapPin}
          iconColor="text-indigo-600 dark:text-indigo-400"
          badgeText="100% BLR GRID"
          badgeClassName="bg-indigo-50 text-indigo-700 border-indigo-200"
        />

        <DashboardMetricCard
          title="Active Incidents"
          value={isLoading ? "--" : (analytics?.total_incidents || 0)}
          subtitle="Current traffic obstructions"
          icon={AlertTriangle}
          iconColor="text-amber-600 dark:text-amber-400"
          badgeText="LIVE SENSORS"
          badgeClassName="bg-amber-50 text-amber-700 border-amber-200"
        />
      </div>

      {/* Filter and Time Range Selector Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Time Range:
          </span>
          {[
            { id: '24h', label: 'Today (24h)' },
            { id: 'morning', label: 'Morning Rush (8-10 AM)' },
            { id: 'evening', label: 'Evening Rush (5-8 PM)' },
            { id: 'offpeak', label: 'Off-Peak' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeRange(item.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                timeRange === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Corridor:
          </span>
          {[
            { id: 'ALL', label: 'All Roads' },
            { id: 'ORR', label: 'Ring Roads' },
            { id: 'TECH', label: 'Tech Hubs' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setRoadFilter(cat.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all ${
                roadFilter === cat.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Charts Row 1: Congestion Distribution & Hourly Pattern */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <CongestionDistributionChart data={analytics.congestion_distribution} />
            <HourlyTrafficChart data={analytics.hourly_patterns} />
          </div>

          {/* Charts Row 2: Top Congested Roads & Speed vs Free-Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <CongestedRoadsChart roads={filteredRoads} />
            <SpeedComparisonChart data={analytics.speed_vs_freeflow} />
          </div>

          {/* Charts Row 3: Incidents by classification */}
          {analytics.incident_stats.length > 0 && (
            <div className="w-full">
              <IncidentStatsChart data={analytics.incident_stats} />
            </div>
          )}
        </div>
      ) : null}
    </PageContainer>
  );
}
