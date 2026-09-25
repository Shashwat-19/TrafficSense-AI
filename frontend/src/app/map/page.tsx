'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/layout/page-container';

const TrafficMapComponent = dynamic(
  () => import('@/components/traffic/traffic-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-10rem)] min-h-[550px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-4 border border-slate-200 dark:border-slate-800">
        <Skeleton className="w-full h-full rounded-2xl" />
      </div>
    )
  }
);

export default function MapPage() {
  return (
    <PageContainer
      title="Interactive Traffic Map"
      subtitle="Full-screen spatial monitoring of Bangalore road corridors, congestion density, and incidents."
      className="pb-4"
    >
      <Suspense fallback={
        <div className="w-full h-[calc(100vh-10rem)] min-h-[550px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-4">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      }>
        <TrafficMapComponent />
      </Suspense>
    </PageContainer>
  );
}
