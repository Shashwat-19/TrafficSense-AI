'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTrafficData, getIncidents } from '@/lib/api/client';
import type { TrafficSegment, Incident, AppResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Map as MapIcon, AlertTriangle } from 'lucide-react';
import { CONGESTION_COLORS } from '@/lib/congestion';
import type { CongestionLevel } from '@/types';

function getColor(level: string): string {
  return CONGESTION_COLORS[level as CongestionLevel]?.fill || '#6b7280';
}

function getIncidentIcon(severity: string) {
  const color = severity === 'CRITICAL' ? '#ef4444' : severity === 'HIGH' ? '#f97316' : severity === 'MODERATE' ? '#eab308' : '#3b82f6';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function TrafficMapComponent() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<TrafficSegment | null>(null);

  const {
    data: trafficRes,
    isLoading: loadingTraffic,
    refetch: refetchTraffic,
    isError: isErrorTraffic,
  } = useQuery({
    queryKey: ['trafficSegments'],
    queryFn: getTrafficData,
    refetchInterval: autoRefresh ? 120000 : false,
  });

  const {
    data: incidentsRes,
    isLoading: loadingIncidents,
    refetch: refetchIncidents,
  } = useQuery({
    queryKey: ['mapIncidents'],
    queryFn: () => getIncidents(),
    refetchInterval: autoRefresh ? 120000 : false,
  });

  const traffic = (trafficRes?.data ?? []) as TrafficSegment[];
  const incidents = (incidentsRes?.data ?? []) as Incident[];
  const dataMode = trafficRes?.data_mode || 'demo';

  const handleRefresh = () => {
    refetchTraffic();
    refetchIncidents();
  };

  if (isErrorTraffic) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-4">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-medium">Failed to load map data</h3>
        <p className="text-sm text-muted-foreground mb-4">Check that the backend is running on port 8000</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex flex-col md:flex-row">
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 z-[400] flex gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-md border">
        <Badge variant="outline" className={dataMode === 'live' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}>
          {dataMode === 'live' ? '● LIVE' : '● DEMO'}
        </Badge>
        <Button
          variant={autoRefresh ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          Auto {autoRefresh ? 'ON' : 'OFF'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingTraffic || loadingIncidents}>
          <RefreshCw className={`h-4 w-4 ${loadingTraffic || loadingIncidents ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1 h-full relative z-0">
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {traffic.map((segment) => (
            <CircleMarker
              key={segment.id}
              center={[segment.latitude, segment.longitude]}
              radius={10}
              pathOptions={{
                color: getColor(segment.congestion_level),
                fillColor: getColor(segment.congestion_level),
                fillOpacity: 0.7,
                weight: 2,
              }}
              eventHandlers={{
                click: () => setSelectedSegment(segment),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <h4 className="font-semibold text-sm mb-2">{segment.road_name}</h4>
                  <div className="text-xs space-y-1">
                    <p>Speed: <span className="font-medium">{segment.current_speed} km/h</span></p>
                    <p>Free flow: <span className="font-medium">{segment.free_flow_speed} km/h</span></p>
                    <p>Congestion: <span className="font-medium">{segment.congestion_level}</span> ({(segment.congestion_ratio * 100).toFixed(0)}%)</p>
                    {segment.delay_seconds > 0 && (
                      <p className="text-red-600">Delay: {Math.round(segment.delay_seconds / 60)} min</p>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {incidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={getIncidentIcon(incident.severity)}
            >
              <Popup>
                <div className="p-1 min-w-[160px]">
                  <h4 className="font-semibold text-sm mb-1">{incident.type.replace('_', ' ')}</h4>
                  <p className="text-[10px] font-medium mb-1">{incident.severity}</p>
                  <p className="text-xs text-gray-600">{incident.description}</p>
                  {incident.road_name && <p className="text-xs mt-1">📍 {incident.road_name}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Side panel */}
      <div className="w-full md:w-80 h-1/3 md:h-full bg-background border-t md:border-t-0 md:border-l z-10 flex flex-col shadow-xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <MapIcon className="h-5 w-5" /> Details
          </h3>
          <span className="text-xs text-muted-foreground">{traffic.length} segments</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedSegment ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{selectedSegment.road_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Speed:</span>
                  <span className="font-medium">{selectedSegment.current_speed} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Free Flow:</span>
                  <span className="font-medium">{selectedSegment.free_flow_speed} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Congestion:</span>
                  <Badge variant="outline" style={{ color: getColor(selectedSegment.congestion_level), borderColor: getColor(selectedSegment.congestion_level) }}>
                    {selectedSegment.congestion_level} ({(selectedSegment.congestion_ratio * 100).toFixed(0)}%)
                  </Badge>
                </div>
                {selectedSegment.delay_seconds > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Delay:</span>
                    <span className="font-medium">{Math.round(selectedSegment.delay_seconds / 60)} min</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-medium">{(selectedSegment.confidence * 100).toFixed(0)}%</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-4 text-sm text-muted-foreground border rounded-lg border-dashed">
              Click on a traffic segment on the map to see details
            </div>
          )}

          <div>
            <h4 className="font-medium text-sm mb-3">Active Incidents ({incidents.length})</h4>
            <div className="space-y-2">
              {incidents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active incidents</p>
              ) : (
                incidents.map((incident) => (
                  <div key={incident.id} className="p-3 border rounded-lg text-sm bg-muted/50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-xs">{incident.type.replace('_', ' ')}</span>
                      <Badge variant="outline" className="text-[10px] h-4 py-0">{incident.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                    {incident.road_name && <p className="text-xs mt-1 text-muted-foreground">📍 {incident.road_name}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
