'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getIncidents } from '@/lib/api/client';
import type { Incident } from '@/types';
import { PageContainer } from '@/components/layout/page-container';
import { IncidentCard } from '@/components/incidents/incident-card';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  CircleAlert
} from 'lucide-react';

export default function IncidentsPage() {
  const [severity, setSeverity] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [searchLocation, setSearchLocation] = useState('');

  const { data: res, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => getIncidents(),
    refetchInterval: 60000,
  });

  const allIncidents = (res?.data ?? []) as Incident[];
  const dataMode = res?.data_mode || 'demo';

  // Compute metrics
  const criticalCount = allIncidents.filter(i => i.severity === 'CRITICAL').length;
  const closuresCount = allIncidents.filter(i => i.type === 'ROAD_CLOSURE').length;
  const constructionCount = allIncidents.filter(i => i.type === 'CONSTRUCTION').length;

  const filtered = allIncidents.filter(inc => {
    if (severity !== 'ALL' && inc.severity !== severity) return false;
    if (type !== 'ALL' && inc.type !== type) return false;
    if (searchLocation && !((inc.road_name || '').toLowerCase().includes(searchLocation.toLowerCase()) || inc.description.toLowerCase().includes(searchLocation.toLowerCase()))) {
      return false;
    }
    return true;
  });

  return (
    <PageContainer
      title="Incident Monitoring"
      subtitle="Real-time tracking of accidents, construction work, and closures across Bangalore."
      dataMode={dataMode}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          <span>Refresh Incidents</span>
        </Button>
      }
    >
      {/* Incident Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Active</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{allIncidents.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Bangalore grid</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 shadow-2xs">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-1">Critical Hazards</span>
          <span className="text-2xl font-bold text-rose-700 dark:text-rose-300">{criticalCount}</span>
          <span className="text-[11px] text-rose-500/80 block mt-0.5">Immediate attention</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Road Closures</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{closuresCount}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Detours required</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 shadow-2xs">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block mb-1">Active Construction</span>
          <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{constructionCount}</span>
          <span className="text-[11px] text-amber-500/80 block mt-0.5">Metro & flyover zones</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            placeholder="Search location or keyword..."
            className="h-9 pl-9 pr-3 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={severity} onValueChange={(v) => { if (v) setSeverity(v); }}>
            <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MODERATE">Moderate</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={(v) => { if (v) setType(v); }}>
            <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <SelectValue placeholder="Incident Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Hazard Types</SelectItem>
              <SelectItem value="ACCIDENT">Accidents</SelectItem>
              <SelectItem value="ROAD_CLOSURE">Road Closures</SelectItem>
              <SelectItem value="CONSTRUCTION">Construction</SelectItem>
              <SelectItem value="CONGESTION">Congestion Spikes</SelectItem>
              <SelectItem value="OBSTRUCTION">Obstructions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Incidents List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center gap-3">
            <AlertTriangle className="h-10 w-10 text-rose-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Unable to Load Incidents</h3>
            <p className="text-xs text-slate-500 text-center max-w-sm">
              Please check backend connection.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <CircleAlert className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-700 stroke-1" />
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No incidents match current criteria</h4>
          <p className="text-xs text-slate-500 mt-1">Try resetting the filters or check back shortly.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 px-1 font-medium">
            Showing {filtered.length} active incident{filtered.length !== 1 ? 's' : ''}
          </div>
          {filtered.map((inc) => (
            <IncidentCard key={inc.id} incident={inc} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
