'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPredictions, getTrafficData } from '@/lib/api/client';
import type { TrafficPrediction, TrafficSegment, CongestionLevel } from '@/types';
import { PageContainer } from '@/components/layout/page-container';
import { PredictionCard } from '@/components/predictions/prediction-card';
import { PredictionChart } from '@/components/predictions/prediction-chart';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  RefreshCw, 
  AlertCircle, 
  Cpu
} from 'lucide-react';

export default function PredictionsPage() {
  const [horizon, setHorizon] = useState('30');
  const [segmentId, setSegmentId] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<'ALL' | CongestionLevel>('ALL');

  const { data: trafficRes } = useQuery({
    queryKey: ['trafficSegments'],
    queryFn: getTrafficData,
  });

  const { data: predRes, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['predictions', horizon, segmentId],
    queryFn: () => getPredictions(Number(horizon), segmentId === 'all' ? undefined : segmentId),
    refetchInterval: 120000,
  });

  const segments = (trafficRes?.data ?? []) as TrafficSegment[];
  const predictions = (predRes?.data ?? []) as TrafficPrediction[];
  const dataMode = predRes?.data_mode || 'demo';

  // Apply filters
  const filteredPredictions = predictions.filter(p => {
    if (levelFilter !== 'ALL' && p.predicted_level !== levelFilter) return false;
    return true;
  });

  return (
    <PageContainer
      title="Traffic Predictions"
      subtitle="Machine-learning speed forecasts and congestion projections for Bangalore roads."
      dataMode={dataMode}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Update Models</span>
          </Button>
        </div>
      }
    >
      {/* Controls Bar: Horizon Tabs + Segment Filter + Congestion Filter */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Horizon tabs */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Brain className="h-3.5 w-3.5 text-indigo-600" /> Horizon:
          </span>
          <Tabs value={horizon} onValueChange={setHorizon} className="w-auto">
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-9">
              <TabsTrigger value="15" className="text-xs px-3 rounded-lg font-medium">15 min</TabsTrigger>
              <TabsTrigger value="30" className="text-xs px-3 rounded-lg font-medium">30 min</TabsTrigger>
              <TabsTrigger value="60" className="text-xs px-3 rounded-lg font-medium">60 min</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Road segment & status filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={segmentId} onValueChange={(v) => setSegmentId(v || 'all')}>
            <SelectTrigger className="w-[220px] h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <SelectValue placeholder="All Segments" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Bangalore Corridors</SelectItem>
              {segments.map((seg) => (
                <SelectItem key={seg.id} value={seg.id}>
                  {seg.road_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Level Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            {(['ALL', 'LOW', 'MODERATE', 'HIGH', 'SEVERE'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all ${
                  levelFilter === lvl
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {lvl === 'ALL' ? 'All' : lvl.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error ? (
        <Card className="border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Unable to Load Machine Learning Predictions</h3>
            <p className="text-xs text-slate-500 text-center max-w-sm">
              Verify that the ML inference service and XGBoost model artifacts are accessible.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl mt-2">
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Retry Fetch
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Prediction Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPredictions.map((pred) => (
              <PredictionCard
                key={`${pred.segment_id}-${pred.horizon_minutes}`}
                prediction={pred}
              />
            ))}
          </div>

          {filteredPredictions.length === 0 && (
            <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              No corridors match the selected filter. Try selecting &ldquo;All&rdquo; or changing the time horizon.
            </Card>
          )}

          {/* Model Projections Comparison Chart */}
          {predictions.length > 0 && (
            <PredictionChart
              predictions={predictions}
              horizon={Number(horizon)}
            />
          )}

          {/* ML Model Architecture Card */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  XGBoost Traffic Speed Regressor
                </h4>
              </div>
              <span className="text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                xgb_speed_model.pkl
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Trained on historical Bangalore TomTom probe data and OpenWeather records across 25 arterial segments. Features evaluated include: <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">hour_of_day</code>, <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">day_of_week</code>, <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">precipitation</code>, <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">free_flow_speed</code>, and rolling speed lags.
            </p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
