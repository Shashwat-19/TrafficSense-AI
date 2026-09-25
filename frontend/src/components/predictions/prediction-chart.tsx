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
  Legend,
  CartesianGrid,
} from 'recharts';
import { Brain } from 'lucide-react';
import type { TrafficPrediction } from '@/types';

interface PredictionChartProps {
  predictions: TrafficPrediction[];
  horizon: number;
}

export function PredictionChart({ predictions, horizon }: PredictionChartProps) {
  const displayData = predictions.slice(0, 10);

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Current Velocity vs Predicted Velocity (+{horizon} min)
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Comparison between live corridor velocity and XGBoost regressor projections.
        </p>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.7)" />
              <XAxis
                dataKey="road_name"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={60}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                unit=" km"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const current = payload.find(p => p.dataKey === 'current_speed')?.value;
                    const predicted = payload.find(p => p.dataKey === 'predicted_speed')?.value;
                    const diff = Math.round(Number(predicted) - Number(current));
                    return (
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-xs space-y-1">
                        <p className="font-bold text-slate-900 dark:text-white">{label}</p>
                        <p className="text-blue-600 dark:text-blue-400">
                          Current Velocity: <strong>{Math.round(Number(current))} km/h</strong>
                        </p>
                        <p className="text-indigo-600 dark:text-indigo-400">
                          Predicted (+{horizon}m): <strong>{Math.round(Number(predicted))} km/h</strong>
                        </p>
                        <p className={`text-[11px] pt-1 border-t border-slate-100 font-semibold ${diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          Forecast Delta: {diff > 0 ? `+${diff}` : diff} km/h
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px' }} />
              <Bar
                dataKey="current_speed"
                name="Current Speed"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="predicted_speed"
                name={`Predicted (+${horizon}m)`}
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
