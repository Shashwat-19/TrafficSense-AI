'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPredictions, getTrafficData } from '@/lib/api/client';
import type { TrafficPrediction, TrafficSegment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONGESTION_COLORS } from '@/lib/congestion';
import type { CongestionLevel } from '@/types';

function getCongestionColor(level: string) {
  const c = CONGESTION_COLORS[level as CongestionLevel];
  return c ? `${c.text} ${c.bg}` : 'text-gray-500 bg-gray-500/10';
}

export default function PredictionsPage() {
  const [horizon, setHorizon] = useState('15');
  const [segmentId, setSegmentId] = useState<string>('all');

  const { data: trafficRes } = useQuery({
    queryKey: ['trafficSegments'],
    queryFn: getTrafficData,
  });

  const { data: predRes, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', horizon, segmentId],
    queryFn: () => getPredictions(Number(horizon), segmentId === 'all' ? undefined : segmentId),
  });

  const segments = (trafficRes?.data ?? []) as TrafficSegment[];
  const predictions = (predRes?.data ?? []) as TrafficPrediction[];
  const dataMode = predRes?.data_mode || 'demo';

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8" /> Predictions
        </h1>
        <Badge variant="outline" className={dataMode === 'live' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}>
          {dataMode === 'live' ? '● LIVE' : '● DEMO'}
        </Badge>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Tabs value={horizon} onValueChange={setHorizon}>
          <TabsList>
            <TabsTrigger value="15">15 min</TabsTrigger>
            <TabsTrigger value="30">30 min</TabsTrigger>
            <TabsTrigger value="60">60 min</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={segmentId} onValueChange={(v) => setSegmentId(v ?? 'all')}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Select segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            {segments.map((seg) => (
              <SelectItem key={seg.id} value={seg.id}>
                {seg.road_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {error ? (
        <Card className="border-red-200">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p>Error loading predictions. Is the backend running?</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Prediction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((pred) => (
              <Card key={`${pred.segment_id}-${pred.horizon_minutes}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{pred.road_name || pred.segment_id}</CardTitle>
                    <Badge className={getCongestionColor(pred.predicted_level)}>
                      {pred.predicted_level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Speed:</span>
                      <span className="font-medium">{pred.current_speed?.toFixed(0) || '--'} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Predicted Speed:</span>
                      <span className="font-medium">{pred.predicted_speed.toFixed(0)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Predicted Congestion:</span>
                      <span className="font-medium">{(pred.predicted_congestion * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-medium">{(pred.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground text-right mt-2">
                      {pred.horizon_minutes} min horizon
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Chart */}
          {predictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Current vs Predicted Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={predictions.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="road_name" angle={-25} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                    <YAxis label={{ value: 'km/h', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current_speed" fill="#3b82f6" name="Current" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="predicted_speed" fill="#8b5cf6" name="Predicted" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {predictions.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No predictions available. Select a segment or check backend.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
