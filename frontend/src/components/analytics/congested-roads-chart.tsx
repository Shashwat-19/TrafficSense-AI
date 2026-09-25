'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Flame } from 'lucide-react';
import type { TopCongestedRoad, CongestionLevel } from '@/types';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

interface CongestedRoadsChartProps {
  roads: TopCongestedRoad[];
}

export function CongestedRoadsChart({ roads }: CongestedRoadsChartProps) {
  const displayRoads = roads.slice(0, 8);

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Top Bottlenecks & Congestion Index
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Roads with greatest velocity suppression relative to design speed.
        </p>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayRoads}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(226, 232, 240, 0.7)" />
              <XAxis
                type="number"
                domain={[0, 1]}
                tickFormatter={(v) => `${Math.round(v * 100)}%`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                type="category"
                dataKey="road_name"
                width={150}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as TopCongestedRoad;
                    const style = CONGESTION_COLORS[item.congestion_level as CongestionLevel];
                    return (
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-xs space-y-1">
                        <p className="font-bold text-slate-900 dark:text-white">{item.road_name}</p>
                        <p style={{ color: style.fill }}>
                          Status: <strong>{getCongestionLabel(item.congestion_level)} ({Math.round(item.congestion_ratio * 100)}%)</strong>
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          Speed: {Math.round(item.current_speed)} km/h (Free: {Math.round(item.free_flow_speed)} km/h)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="congestion_ratio" radius={[0, 6, 6, 0]}>
                {displayRoads.map((entry) => (
                  <Cell
                    key={entry.road_name}
                    fill={CONGESTION_COLORS[entry.congestion_level as CongestionLevel]?.fill || '#f97316'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
