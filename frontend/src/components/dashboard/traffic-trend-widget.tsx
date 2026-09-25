'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { HourlyPattern } from '@/types';

interface TrafficTrendWidgetProps {
  data: HourlyPattern[];
  isLoading: boolean;
}

export function TrafficTrendWidget({ data, isLoading }: TrafficTrendWidgetProps) {
  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            24h Traffic Trend
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hourly average speed (km/h) vs congestion level across Bangalore.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        {isLoading ? (
          <Skeleton className="w-full h-[260px] rounded-xl" />
        ) : !data || data.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
            No trend data available
          </div>
        ) : (
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.7)" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(h) => `${h}:00`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="speed"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  unit=" km"
                />
                <YAxis
                  yAxisId="congestion"
                  orientation="right"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const speed = payload.find(p => p.dataKey === 'avg_speed')?.value;
                      const congestion = payload.find(p => p.dataKey === 'avg_congestion')?.value;
                      return (
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-xs space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{label}:00 IST</p>
                          <p className="text-blue-600 dark:text-blue-400">
                            Avg Speed: <strong className="font-semibold">{Math.round(Number(speed))} km/h</strong>
                          </p>
                          <p className="text-rose-600 dark:text-rose-400">
                            Congestion: <strong className="font-semibold">{Math.round(Number(congestion) * 100)}%</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={30}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Line
                  yAxisId="speed"
                  type="monotone"
                  dataKey="avg_speed"
                  name="Speed (km/h)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="congestion"
                  type="monotone"
                  dataKey="avg_congestion"
                  name="Congestion %"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
