'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import type { CongestionDistribution, CongestionLevel } from '@/types';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

interface CongestionDistributionChartProps {
  data: CongestionDistribution[];
}

export function CongestionDistributionChart({ data }: CongestionDistributionChartProps) {
  const totalCount = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Congestion Distribution
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Breakdown of monitored Bangalore segments by flow level.
        </p>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="w-full sm:w-1/2 h-[240px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="count"
                nameKey="level"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.level}
                    fill={CONGESTION_COLORS[entry.level as CongestionLevel]?.fill || '#94a3b8'}
                    strokeWidth={2}
                    stroke="#ffffff"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as CongestionDistribution;
                    const color = CONGESTION_COLORS[item.level as CongestionLevel]?.fill;
                    return (
                      <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                          {getCongestionLabel(item.level)}
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">
                          Segments: <strong>{item.count}</strong> ({Math.round(item.percentage)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Segments</span>
          </div>
        </div>

        {/* Legend pills */}
        <div className="w-full sm:w-1/2 space-y-2.5">
          {data.map((item) => {
            const style = CONGESTION_COLORS[item.level as CongestionLevel] || CONGESTION_COLORS.LOW;
            return (
              <div
                key={item.level}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: style.fill }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {getCongestionLabel(item.level)}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">{item.count}</span>
                  <span className="text-slate-400 text-[11px]">({Math.round(item.percentage)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
