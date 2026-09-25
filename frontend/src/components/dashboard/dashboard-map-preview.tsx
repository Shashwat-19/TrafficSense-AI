'use client';

import React from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { TrafficSegment } from '@/types';
import { CONGESTION_COLORS, getCongestionLabel } from '@/lib/congestion';

interface DashboardMapPreviewProps {
  segments: TrafficSegment[];
}

export default function DashboardMapPreview({ segments }: DashboardMapPreviewProps) {
  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={11}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: '#f8fafc' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {segments.map((segment) => {
          const style = CONGESTION_COLORS[segment.congestion_level] || CONGESTION_COLORS.LOW;
          return (
            <CircleMarker
              key={segment.id}
              center={[segment.latitude, segment.longitude]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                fillColor: style.fill,
                fillOpacity: 0.9,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="p-3 min-w-[200px] text-slate-800">
                  <div className="font-bold text-xs text-slate-900 mb-1">{segment.road_name}</div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.fill }} />
                    <span className="text-[11px] font-semibold" style={{ color: style.fill }}>
                      {getCongestionLabel(segment.congestion_level)} ({Math.round(segment.congestion_ratio * 100)}%)
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-1.5">
                    <div className="flex justify-between">
                      <span>Current Speed:</span>
                      <span className="font-semibold text-slate-800">{Math.round(segment.current_speed)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free-flow:</span>
                      <span>{Math.round(segment.free_flow_speed)} km/h</span>
                    </div>
                    {segment.delay_seconds > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>Delay:</span>
                        <span>{Math.round(segment.delay_seconds / 60)} min</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/map?road=${encodeURIComponent(segment.road_name)}`}
                      className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center justify-between"
                    >
                      <span>Inspect Segment</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
