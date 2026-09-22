'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const TrafficMapComponent = dynamic(
  () => import('@/components/traffic/traffic-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[calc(100vh-4rem)] bg-muted flex items-center justify-center p-4">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    )
  }
);

export default function MapPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)]">
      <TrafficMapComponent />
    </div>
  );
}
