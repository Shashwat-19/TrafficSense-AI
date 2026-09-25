'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  LayoutDashboard,
  Map,
  BarChart3,
  LineChart,
  Route,
  AlertTriangle,
  BellRing,
  MessageSquare,
  Settings,
  Search,
  MapPin,
  ArrowRight,
} from 'lucide-react';

const PAGES = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, category: 'Pages' },
  { name: 'Traffic Map', href: '/map', icon: Map, category: 'Pages' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, category: 'Pages' },
  { name: 'Predictions', href: '/predictions', icon: LineChart, category: 'Pages' },
  { name: 'Route Planner', href: '/routes', icon: Route, category: 'Pages' },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle, category: 'Pages' },
  { name: 'Alerts', href: '/alerts', icon: BellRing, category: 'Pages' },
  { name: 'AI Assistant', href: '/chat', icon: MessageSquare, category: 'Pages' },
  { name: 'Settings', href: '/settings', icon: Settings, category: 'Pages' },
];

const ROADS = [
  { name: 'Outer Ring Road (Bellandur)', segmentId: 'seg-004', area: 'East BLR' },
  { name: 'Silk Board Junction', segmentId: 'seg-002', area: 'South BLR' },
  { name: 'Outer Ring Road (Marathahalli)', segmentId: 'seg-003', area: 'East BLR' },
  { name: 'Whitefield Main Road', segmentId: 'seg-005', area: 'East BLR' },
  { name: 'Electronic City Flyover', segmentId: 'seg-006', area: 'South BLR' },
  { name: 'Hebbal Flyover', segmentId: 'seg-016', area: 'North BLR' },
  { name: 'MG Road', segmentId: 'seg-001', area: 'Central BLR' },
  { name: 'Indiranagar 100 Feet Road', segmentId: 'seg-009', area: 'East BLR' },
  { name: 'Koramangala Inner Ring Road', segmentId: 'seg-008', area: 'South-East BLR' },
  { name: 'Hosur Road', segmentId: 'seg-007', area: 'South BLR' },
  { name: 'KR Puram Bridge', segmentId: 'seg-017', area: 'East BLR' },
  { name: 'Sarjapur Road', segmentId: 'seg-020', area: 'South-East BLR' },
  { name: 'Old Airport Road', segmentId: 'seg-021', area: 'East BLR' },
  { name: 'Bannerghatta Road', segmentId: 'seg-011', area: 'South BLR' },
];

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const filteredPages = PAGES.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredRoads = ROADS.filter(r =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.area.toLowerCase().includes(query.toLowerCase())
  );

  const navigateTo = (path: string) => {
    onOpenChange(false);
    setQuery('');
    router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Search className="h-4 w-4 text-slate-400 shrink-0 mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bangalore corridors, pages, actions... (e.g. ORR, Silk Board, Chat)"
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-12 px-0 bg-transparent"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {/* Roads Section */}
          {filteredRoads.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Monitored Corridors
              </div>
              {filteredRoads.slice(0, 5).map((road) => (
                <button
                  key={road.name}
                  onClick={() => navigateTo(`/map?road=${encodeURIComponent(road.name)}`)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{road.name}</span>
                      <span className="text-xs text-slate-400 ml-2">({road.area})</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                    View on Map <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Navigation Section */}
          {filteredPages.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Navigation
              </div>
              {filteredPages.map((page) => {
                const Icon = page.icon;
                return (
                  <button
                    key={page.name}
                    onClick={() => navigateTo(page.href)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                      <span className="font-medium text-slate-700 dark:text-slate-200">{page.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredPages.length === 0 && filteredRoads.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span>TrafficSense Bangalore Corridor Index</span>
          <span className="text-[11px]">Navigate with Click or Enter</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
