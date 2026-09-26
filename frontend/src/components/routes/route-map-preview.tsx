'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteAlternative, CongestionLevel } from '@/types';
import { CONGESTION_COLORS } from '@/lib/congestion';
import { getMapTileConfig } from '@/lib/map-config';

interface RouteMapPreviewProps {
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  alternatives: RouteAlternative[];
  selectedRouteId?: string;
}

function MapBoundsFitter({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

function createPinIcon(color: string, label: string) {
  return L.divIcon({
    className: 'custom-route-pin',
    html: `
      <div style="
        background-color: ${color}; 
        color: white; 
        font-size: 11px; 
        font-weight: bold; 
        padding: 4px 8px; 
        border-radius: 9999px; 
        border: 2px solid white; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span>📍</span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [80, 26],
    iconAnchor: [40, 13],
  });
}

export default function RouteMapPreview({
  origin,
  destination,
  alternatives,
  selectedRouteId,
}: RouteMapPreviewProps) {
  // All points for fitting map bounds
  const allCoordinates: [number, number][] = [
    [origin.lat, origin.lng],
    [destination.lat, destination.lng],
    ...alternatives.flatMap(a => a.points.map(p => [p.latitude, p.longitude] as [number, number])),
  ];

  const mapTileConfig = React.useMemo(() => getMapTileConfig(), []);

  return (
    <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 relative shadow-sm">
      <MapContainer
        center={[origin.lat, origin.lng]}
        zoom={12}
        style={{ width: '100%', height: '100%', background: '#f8fafc' }}
        zoomControl={true}
      >
        <MapBoundsFitter points={allCoordinates} />

        <TileLayer
          attribution={mapTileConfig.attribution}
          url={mapTileConfig.url}
          maxZoom={mapTileConfig.maxZoom}
        />

        {/* Origin Marker */}
        <Marker
          position={[origin.lat, origin.lng]}
          icon={createPinIcon('#10b981', origin.name)}
        />

        {/* Destination Marker */}
        <Marker
          position={[destination.lat, destination.lng]}
          icon={createPinIcon('#ef4444', destination.name)}
        />

        {/* Alternative Routes Polylines */}
        {alternatives.map((alt, idx) => {
          const isSelected = selectedRouteId ? alt.id === selectedRouteId : idx === 0;
          const polylineCoords = alt.points.map(p => [p.latitude, p.longitude] as [number, number]);
          const colorInfo = CONGESTION_COLORS[alt.congestion_level as CongestionLevel] || CONGESTION_COLORS.LOW;

          return (
            <Polyline
              key={alt.id}
              positions={polylineCoords}
              pathOptions={{
                color: isSelected ? colorInfo.fill : '#94a3b8',
                weight: isSelected ? 6 : 4,
                opacity: isSelected ? 0.95 : 0.6,
                dashArray: isSelected ? undefined : '6 6',
              }}
            >
              <Popup>
                <div className="p-2.5 text-xs text-slate-800">
                  <div className="font-bold text-slate-900 mb-0.5">{alt.name}</div>
                  <div className="text-slate-600">
                    {alt.distance_km.toFixed(1)} km • {Math.round(alt.travel_time_seconds / 60)} min
                  </div>
                  {alt.delay_seconds > 0 && (
                    <div className="text-rose-600 font-medium">
                      +{Math.round(alt.delay_seconds / 60)} min delay
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>
          );
        })}
      </MapContainer>
    </div>
  );
}
