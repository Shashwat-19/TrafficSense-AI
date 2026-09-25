'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  X, 
  MapPin, 
  Clock, 
  Brain, 
  Navigation, 
  MessageSquare
} from 'lucide-react';
import type { TrafficSegment, TrafficPrediction } from '@/types';
import { getPredictions } from '@/lib/api/client';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

interface RoadDetailsProps {
  segment: TrafficSegment;
  onClose: () => void;
}

export function RoadDetails({ segment, onClose }: RoadDetailsProps) {
  // Query 30m ML prediction for this specific segment
  const { data: predRes, isLoading: loadingPred } = useQuery({
    queryKey: ['prediction-segment', segment.id],
    queryFn: () => getPredictions(30, segment.id),
  });

  const prediction = (predRes?.data?.[0]) as TrafficPrediction | undefined;
  const colorInfo = CONGESTION_COLORS[segment.congestion_level] || CONGESTION_COLORS.LOW;
  const ratioPct = Math.round(segment.congestion_ratio * 100);
  const delayMins = Math.round(segment.delay_seconds / 60);

  return (
    <div className="space-y-4">
      {/* Header with Road Name and Close */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Bangalore Arterial Corridor</span>
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
            {segment.road_name}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Primary Status Card */}
      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Flow Status
          </span>
          <Badge
            variant="outline"
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorInfo.border} ${colorInfo.bg} ${colorInfo.text}`}
          >
            {getCongestionLabel(segment.congestion_level)} Traffic
          </Badge>
        </div>

        {/* Speed Comparison */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px]">Current Speed</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {Math.round(segment.current_speed)} km/h
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px]">Free-Flow Speed</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {Math.round(segment.free_flow_speed)} km/h
            </span>
          </div>
        </div>

        {/* Congestion Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Congestion Index</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ratioPct}%</span>
          </div>
          <div className="w-full bg-slate-200/70 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(5, ratioPct))}%`,
                backgroundColor: colorInfo.fill,
              }}
            />
          </div>
        </div>

        {/* Estimated Delay */}
        {delayMins > 0 ? (
          <div className="flex items-center justify-between text-xs pt-1 text-rose-600 dark:text-rose-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Estimated Delay:
            </span>
            <span className="font-bold text-sm">+{delayMins} min</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs pt-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Flow Delay:
            </span>
            <span>Zero delay</span>
          </div>
        )}
      </div>

      {/* Machine Learning Prediction Section */}
      <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            30-Min ML Prediction
          </span>
          <span className="text-[10px] font-mono uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
            XGBoost
          </span>
        </div>

        {loadingPred ? (
          <Skeleton className="h-12 w-full rounded-lg" />
        ) : prediction ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Forecast Speed:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.round(prediction.predicted_speed)} km/h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Projected Congestion:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.round(prediction.predicted_congestion * 100)}% ({getCongestionLabel(prediction.predicted_level)})
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
              <span>Model Confidence: {Math.round(prediction.confidence * 100)}%</span>
              <Link href="/predictions" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                View Trends →
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Prediction model active. Expecting steady traffic patterns for this corridor.
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="pt-1 space-y-2">
        <Link
          href={`/routes?dest=${encodeURIComponent(segment.road_name)}`}
          className="w-full block"
        >
          <Button className="w-full text-xs font-semibold h-9 rounded-xl gap-2 shadow-xs bg-blue-600 hover:bg-blue-700 text-white">
            <Navigation className="h-3.5 w-3.5" />
            Find Route via {segment.road_name.split(' ')[0]}
          </Button>
        </Link>

        <Link
          href={`/chat?prompt=${encodeURIComponent(`What is the traffic situation and delay on ${segment.road_name} right now?`)}`}
          className="w-full block"
        >
          <Button variant="outline" className="w-full text-xs font-semibold h-9 rounded-xl gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
            Ask AI Assistant About Corridor
          </Button>
        </Link>
      </div>
    </div>
  );
}
