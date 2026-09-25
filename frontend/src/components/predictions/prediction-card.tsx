'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import type { TrafficPrediction, CongestionLevel } from '@/types';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

interface PredictionCardProps {
  prediction: TrafficPrediction;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const currentSpeed = prediction.current_speed ?? 30;
  const predictedSpeed = prediction.predicted_speed;
  const speedDiff = Math.round(predictedSpeed - currentSpeed);
  const isDropping = speedDiff < 0;
  const colorInfo = CONGESTION_COLORS[prediction.predicted_level as CongestionLevel] || CONGESTION_COLORS.LOW;
  const congestionPct = Math.round(prediction.predicted_congestion * 100);
  const confidencePct = Math.round(prediction.confidence * 100);

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      <CardContent className="p-5 space-y-4">
        {/* Top: Road Name and Level Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-0.5">
              <MapPin className="h-3 w-3 text-blue-600" /> Monitored Corridor
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {prediction.road_name || prediction.segment_id}
            </h3>
          </div>

          <Badge
            variant="outline"
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorInfo.border} ${colorInfo.bg} ${colorInfo.text} shrink-0`}
          >
            {getCongestionLabel(prediction.predicted_level)}
          </Badge>
        </div>

        {/* Speed Comparison: Current vs Predicted */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Current Speed</span>
            <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
              {Math.round(currentSpeed)} <span className="text-xs font-normal text-slate-400">km/h</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Forecast</span>
              <span className={`inline-flex items-center text-[11px] font-bold ${isDropping ? 'text-rose-600' : 'text-emerald-600'}`}>
                {isDropping ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <TrendingUp className="h-3 w-3 mr-0.5" />}
                {speedDiff > 0 ? `+${speedDiff}` : speedDiff}
              </span>
            </div>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {Math.round(predictedSpeed)} <span className="text-xs font-normal text-blue-500">km/h</span>
            </span>
          </div>
        </div>

        {/* Predicted Congestion & Confidence Bar */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Projected Congestion</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{congestionPct}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(5, congestionPct))}%`,
                  backgroundColor: colorInfo.fill,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
              Confidence: <strong className="text-slate-700 dark:text-slate-300">{confidencePct}%</strong>
            </span>
            <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              +{prediction.horizon_minutes}m Horizon
            </Badge>
          </div>
        </div>

        {/* Quick action triggers */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          <Link
            href={`/map?road=${encodeURIComponent(prediction.road_name || '')}`}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
          >
            <span>Inspect Map</span>
            <ArrowRight className="h-3 w-3" />
          </Link>

          <Link
            href={`/chat?prompt=${encodeURIComponent(`Explain the predicted traffic conditions and delays on ${prediction.road_name} for the next ${prediction.horizon_minutes} minutes.`)}`}
            className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            <span>Ask AI</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
