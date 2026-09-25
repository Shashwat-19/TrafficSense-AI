'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { TrafficPrediction } from '@/types';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

interface PredictionSummaryProps {
  predictions: TrafficPrediction[];
  isLoading: boolean;
}

export function PredictionSummary({ predictions, isLoading }: PredictionSummaryProps) {
  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            ML Prediction Summary (30m Horizon)
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            XGBoost model projections for primary arterial corridors.
          </p>
        </div>

        <Link href="/predictions">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <span>All Predictions</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No predictions currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {predictions.slice(0, 3).map((pred) => {
              const currentSpeed = pred.current_speed ?? 30;
              const speedDiff = Math.round(pred.predicted_speed - currentSpeed);
              const isDropping = speedDiff < 0;
              const colorInfo = CONGESTION_COLORS[pred.predicted_level] || CONGESTION_COLORS.LOW;

              return (
                <div
                  key={pred.segment_id}
                  className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {pred.road_name || pred.segment_id}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 rounded-full font-semibold border ${colorInfo.border} ${colorInfo.bg} ${colorInfo.text} shrink-0`}
                    >
                      {getCongestionLabel(pred.predicted_level)}
                    </Badge>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Forecast Speed</span>
                      <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {Math.round(pred.predicted_speed)} km/h
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Delta</span>
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isDropping ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isDropping ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {speedDiff > 0 ? `+${speedDiff}` : speedDiff} km/h
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Confidence: {Math.round(pred.confidence * 100)}%</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">+{pred.horizon_minutes}m horizon</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
