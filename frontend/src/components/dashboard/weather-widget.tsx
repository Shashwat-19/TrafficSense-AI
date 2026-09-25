'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Cloud, Wind, Droplets, Sun, CloudRain } from 'lucide-react';
import type { WeatherData } from '@/types';

interface WeatherWidgetProps {
  weather: WeatherData | undefined;
  isLoading: boolean;
}

export function WeatherWidget({ weather, isLoading }: WeatherWidgetProps) {
  // Determine traffic impact based on precipitation / conditions
  const getImpact = (w?: WeatherData) => {
    if (!w) return { label: 'Optimal', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (w.precipitation > 5 || w.condition.toLowerCase().includes('rain')) {
      return { label: 'Heavy Rain Advisory (Reduced Speeds)', style: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    if (w.precipitation > 0 || w.humidity > 85) {
      return { label: 'Wet Road Caution', style: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { label: 'Clear Driving Conditions', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const impact = getImpact(weather);

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Bangalore Microclimate & Context
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Atmospheric conditions and their correlation to traffic delays.
          </p>
        </div>

        <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${impact.style}`}>
          {impact.label}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !weather ? (
          <div className="p-6 text-center text-sm text-slate-400">
            Weather data unavailable
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Sun className="h-3.5 w-3.5 text-amber-500" /> Temperature
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {Math.round(weather.temperature)}°C
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 capitalize">
                {weather.condition}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Droplets className="h-3.5 w-3.5 text-blue-500" /> Humidity
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {weather.humidity}%
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {weather.humidity > 70 ? 'High moisture' : 'Moderate'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Wind className="h-3.5 w-3.5 text-slate-500" /> Wind Speed
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {weather.wind_speed} m/s
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Calm breeze
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <CloudRain className="h-3.5 w-3.5 text-indigo-500" /> Rain
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {weather.precipitation} mm
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Visibility {(weather.visibility / 1000).toFixed(0)} km
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
