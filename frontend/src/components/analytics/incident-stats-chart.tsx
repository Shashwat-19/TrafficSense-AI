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
  CartesianGrid,
} from 'recharts';
import { ShieldAlert } from 'lucide-react';
import type { IncidentStats } from '@/types';

interface IncidentStatsChartProps {
  data: IncidentStats[];
}

export function IncidentStatsChart({ data }: IncidentStatsChartProps) {
  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Active Incidents by Classification
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Distribution of road hazards across Bangalore arterial segments.
        </p>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.7)" />
              <XAxis
                dataKey="type"
                tickFormatter={(v) => v.replace(/_/g, ' ')}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as IncidentStats;
                    return (
                      <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-xs">
                        <span className="font-bold text-slate-900 dark:text-white capitalize">
                          {item.type.replace(/_/g, ' ')}
                        </span>
                        <p className="text-indigo-600 dark:text-indigo-400 mt-0.5">
                          Active Count: <strong>{item.count}</strong>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="count"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
