'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Menu, 
  Search, 
  Bell, 
  MapPin, 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandMenu } from '@/components/layout/command-menu';
import { getAlerts, healthCheck } from '@/lib/api/client';

const routeDetails: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Traffic Intelligence',
    subtitle: 'Real-time traffic conditions, predictions and incidents across Bangalore.',
  },
  '/map': {
    title: 'Interactive Traffic Map',
    subtitle: 'Live visual monitoring of major Bangalore road corridors, congestion, and incidents.',
  },
  '/analytics': {
    title: 'Traffic Analytics',
    subtitle: 'Macro trends, hourly congestion patterns, and corridor bottleneck analysis.',
  },
  '/predictions': {
    title: 'Traffic Predictions',
    subtitle: 'Machine-learning speed forecasts and congestion projections for Bangalore roads.',
  },
  '/routes': {
    title: 'Intelligent Route Planner',
    subtitle: 'Congestion-aware multi-alternative route guidance across Bangalore tech corridors.',
  },
  '/incidents': {
    title: 'Incident Monitoring',
    subtitle: 'Real-time tracking of accidents, construction zones, and road closures.',
  },
  '/alerts': {
    title: 'Intelligent Alert Center',
    subtitle: 'Automated warnings for severe congestion surges, incidents, and weather risks.',
  },
  '/chat': {
    title: 'AI Traffic Assistant',
    subtitle: 'Conversational assistant with tool access for live Bangalore traffic intelligence.',
  },
  '/settings': {
    title: 'Settings & Preferences',
    subtitle: 'Configure corridor alerts, notification rules, map layers, and system APIs.',
  },
};

export function Header() {
  const pathname = usePathname();
  const currentMeta = routeDetails[pathname] || {
    title: 'TrafficSense AI',
    subtitle: 'Bangalore Intelligent Traffic Management',
  };
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Real-time alerts count for notification bell
  const { data: alertsRes } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 60000,
  });

  // Health check for API status indicator
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: healthCheck,
    refetchInterval: 30000,
  });

  const alerts = alertsRes?.data ?? [];
  const unreadCount = alerts.filter(a => !a.is_read).length;
  const dataMode = alertsRes?.data_mode || 'demo';
  const isHealthy = health?.status === 'healthy';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 transition-all">
        {/* Left: Mobile Trigger + Breadcrumb */}
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 md:hidden h-9 w-9 text-slate-600 dark:text-slate-300"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="p-0 w-72">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Region & Active Context */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span>Bangalore, KA</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
              {currentMeta.title}
            </span>
          </div>
        </div>

        {/* Right: Global Search, Status, Notification, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 text-xs font-normal transition-all shadow-2xs w-40 sm:w-56 justify-between"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Search corridors...</span>
            </span>
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
              ⌘K
            </kbd>
          </button>

          {/* Live Data Mode Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
              {dataMode === 'live' ? 'TOMTOM LIVE' : 'SIMULATION'}
            </span>
          </div>

          {/* Notification Alert Bell */}
          <Link href="/alerts">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
              <span className="sr-only">View alerts ({unreadCount} unread)</span>
            </Button>
          </Link>

          {/* User Avatar */}
          <Link href="/settings">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-medium text-xs shadow-xs cursor-pointer hover:ring-2 hover:ring-blue-500/30 transition-all">
              TC
            </div>
          </Link>
        </div>
      </header>

      {/* Global Command Menu Dialog */}
      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
