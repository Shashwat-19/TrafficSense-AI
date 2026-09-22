import { CongestionLevel } from '@/types';

export const CONGESTION_COLORS: Record<CongestionLevel, { text: string; bg: string; border: string; fill: string }> = {
  LOW: { text: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500', fill: '#22c55e' },
  MODERATE: { text: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500', fill: '#eab308' },
  HIGH: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500', fill: '#f97316' },
  SEVERE: { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500', fill: '#ef4444' },
};

export function getCongestionLabel(level: CongestionLevel): string {
  switch (level) {
    case 'LOW': return 'Low';
    case 'MODERATE': return 'Moderate';
    case 'HIGH': return 'High';
    case 'SEVERE': return 'Severe';
    default: return 'Unknown';
  }
}

export function formatSpeed(speed: number): string {
  return `${speed.toFixed(0)} km/h`;
}

export function formatDelay(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} sec`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  }
  return `${minutes} min`;
}

export function formatTimestamp(ts: string | Date): string {
  const date = new Date(ts);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

export function getMapColor(level: CongestionLevel): string {
  return CONGESTION_COLORS[level]?.fill || '#94a3b8';
}
