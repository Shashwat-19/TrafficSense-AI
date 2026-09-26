/**
 * TrafficSense AI — Map Tile Provider Configuration.
 *
 * Uses TomTom Map Display tiles when NEXT_PUBLIC_TOMTOM_API_KEY is available,
 * and falls back to clean OpenStreetMap tiles. Avoids deprecated unauthenticated
 * Carto endpoints that print "API KEY REQUIRED" watermarks.
 */

export interface MapTileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
}

export function getMapTileConfig(): MapTileConfig {
  const tomtomKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

  if (tomtomKey && tomtomKey.trim() !== '') {
    return {
      url: `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${tomtomKey.trim()}`,
      attribution: '&copy; <a href="https://www.tomtom.com" target="_blank" rel="noopener noreferrer">TomTom</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    };
  }

  // OpenStreetMap standard tile server (clean, free, open-source, no watermark)
  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  };
}
