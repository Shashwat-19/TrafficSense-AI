'use client';

import React from 'react';
import { TileLayer } from 'react-leaflet';
import { getMapTileConfig } from '@/lib/map-config';

// Shared base tile layer so every Leaflet map uses the same provider config.
export function MapTileLayer() {
  const config = React.useMemo(() => getMapTileConfig(), []);
  return <TileLayer attribution={config.attribution} url={config.url} maxZoom={config.maxZoom} />;
}
