'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getIncidents } from '@/lib/api/client';
import type { Incident, CongestionLevel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Construction, Ban, CarFront, CircleAlert, Cone, HelpCircle } from 'lucide-react';

const INCIDENT_ICONS: Record<string, React.ElementType> = {
  ACCIDENT: CarFront,
  ROAD_CLOSURE: Ban,
  CONSTRUCTION: Construction,
  CONGESTION: CircleAlert,
  OBSTRUCTION: Cone,
  OTHER: HelpCircle,
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-700',
  MODERATE: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function IncidentsPage() {
  const [severity, setSeverity] = useState('ALL');
  const [type, setType] = useState('ALL');

  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => getIncidents(),
    refetchInterval: 120000,
  });

  const allIncidents = (res?.data ?? []) as Incident[];

  const filtered = allIncidents.filter(inc => {
    if (severity !== 'ALL' && inc.severity !== severity) return false;
    if (type !== 'ALL' && inc.type !== type) return false;
    return true;
  });

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-8 w-8" /> Incidents
        </h1>
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">● DEMO</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={severity} onValueChange={(v) => setSeverity(v ?? 'ALL')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Severities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MODERATE">Moderate</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(v) => setType(v ?? 'ALL')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="ACCIDENT">Accident</SelectItem>
            <SelectItem value="ROAD_CLOSURE">Road Closure</SelectItem>
            <SelectItem value="CONSTRUCTION">Construction</SelectItem>
            <SelectItem value="CONGESTION">Congestion</SelectItem>
            <SelectItem value="OBSTRUCTION">Obstruction</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : error ? (
        <Card className="border-red-200">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p>Failed to load incidents</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <CircleAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No incidents found</p>
            <p className="text-sm">Try adjusting your filters or check back later</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{filtered.length} incident{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map((inc) => {
            const Icon = INCIDENT_ICONS[inc.type] || HelpCircle;
            return (
              <Card key={inc.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-full bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{inc.type.replace(/_/g, ' ')}</span>
                        <Badge className={SEVERITY_COLORS[inc.severity] || ''}>{inc.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{inc.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {inc.road_name && <span>📍 {inc.road_name}</span>}
                        <span suppressHydrationWarning>🕐 {timeAgo(inc.start_time)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
