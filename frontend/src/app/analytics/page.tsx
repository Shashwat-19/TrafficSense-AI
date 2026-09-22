'use client';

import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/lib/api/client';
import type { AnalyticsData, CongestionLevel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { AlertTriangle, Activity, Gauge, MapPin } from 'lucide-react';
import { CONGESTION_COLORS } from '@/lib/congestion';

const PIE_COLORS: Record<CongestionLevel, string> = {
  LOW: '#22c55e',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  SEVERE: '#ef4444',
};

export default function AnalyticsPage() {
  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pt-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pt-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <Card className="border-red-200">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <AlertTriangle className="h-10 w-10 text-red-500" />
            <p>Failed to load analytics data. Is the backend running?</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analytics = res?.data as AnalyticsData;
  if (!analytics) return null;

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <Badge variant="outline" className={res?.data_mode === 'live' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}>
          {res?.data_mode === 'live' ? '● LIVE' : '● DEMO'}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Congestion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.overall_congestion * 100).toFixed(0)}%</div>
            <Badge className={`mt-1 ${CONGESTION_COLORS[analytics.overall_level]?.text} ${CONGESTION_COLORS[analytics.overall_level]?.bg}`}>
              {analytics.overall_level}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avg_speed.toFixed(0)} km/h</div>
            <p className="text-xs text-muted-foreground mt-1">Across all segments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segments Monitored</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_segments}</div>
            <p className="text-xs text-muted-foreground mt-1">Bangalore roads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_incidents}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Congestion Distribution */}
        <Card>
          <CardHeader><CardTitle>Congestion Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.congestion_distribution}
                  cx="50%" cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="level"
                  label={({ name, value }: { name?: string; value?: number }) => `${name || ''} ${value || 0}`}
                >
                  {analytics.congestion_distribution.map((entry) => (
                    <Cell key={entry.level} fill={PIE_COLORS[entry.level]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Traffic Pattern */}
        <Card>
          <CardHeader><CardTitle>Hourly Traffic Pattern</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.hourly_patterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" label={{ value: 'Hour (IST)', position: 'insideBottom', offset: -5 }} />
                <YAxis yAxisId="left" label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 1]} label={{ value: 'Congestion', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avg_speed" name="Avg Speed" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="avg_congestion" name="Congestion" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Congested Roads */}
        <Card>
          <CardHeader><CardTitle>Top Congested Roads</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analytics.top_congested_roads.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="road_name" width={160} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => `${(Number(v) * 100).toFixed(0)}%`} />
                <Bar dataKey="congestion_ratio" name="Congestion" radius={[0, 4, 4, 0]}>
                  {analytics.top_congested_roads.slice(0, 8).map((entry) => (
                    <Cell key={entry.road_name} fill={PIE_COLORS[entry.congestion_level]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Speed vs Free-Flow */}
        <Card>
          <CardHeader><CardTitle>Speed vs Free-Flow Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analytics.speed_vs_freeflow.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="road_name" angle={-30} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'km/h', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="current_speed" name="Current Speed" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="free_flow_speed" name="Free Flow" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Incident Statistics */}
        {analytics.incident_stats.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Incident Statistics by Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.incident_stats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tickFormatter={(v) => v.replace('_', ' ')} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(v: unknown) => String(v ?? '').replace('_', ' ')} />
                  <Bar dataKey="count" name="Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
