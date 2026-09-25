import { CongestionLevel } from '@/types';

export const CONGESTION_COLORS: Record<CongestionLevel, { text: string; bg: string; border: string; fill: string; dot: string; label: string }> = {
  LOW: { 
    text: 'text-emerald-700 dark:text-emerald-400', 
    bg: 'bg-emerald-50 dark:bg-emerald-950/40', 
    border: 'border-emerald-200 dark:border-emerald-800', 
    fill: '#10b981',
    dot: 'bg-emerald-500',
    label: 'Free Flow'
  },
  MODERATE: { 
    text: 'text-amber-700 dark:text-amber-400', 
    bg: 'bg-amber-50 dark:bg-amber-950/40', 
    border: 'border-amber-200 dark:border-amber-800', 
    fill: '#f59e0b',
    dot: 'bg-amber-500',
    label: 'Moderate'
  },
  HIGH: { 
    text: 'text-orange-700 dark:text-orange-400', 
    bg: 'bg-orange-50 dark:bg-orange-950/40', 
    border: 'border-orange-200 dark:border-orange-800', 
    fill: '#f97316',
    dot: 'bg-orange-500',
    label: 'Heavy'
  },
  SEVERE: { 
    text: 'text-rose-700 dark:text-rose-400', 
    bg: 'bg-rose-50 dark:bg-rose-950/40', 
    border: 'border-rose-200 dark:border-rose-800', 
    fill: '#ef4444',
    dot: 'bg-rose-500',
    label: 'Severe'
  },
};

export function getCongestionLabel(level: CongestionLevel): string {
  switch (level) {
    case 'LOW': return 'Free Flow';
    case 'MODERATE': return 'Moderate';
    case 'HIGH': return 'Heavy';
    case 'SEVERE': return 'Severe';
    default: return 'Normal';
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
