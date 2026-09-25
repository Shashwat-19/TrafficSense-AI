'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAlerts, healthCheck } from '@/lib/api/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Traffic Map', href: '/map', icon: Map },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Predictions', href: '/predictions', icon: LineChart },
  { name: 'Route Planner', href: '/routes', icon: Route },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Alerts', href: '/alerts', icon: BellRing, badgeKey: 'alerts' },
  { name: 'AI Assistant', href: '/chat', icon: MessageSquare, highlight: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ className, isCollapsed = false, onToggleCollapse, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  // Query alerts to display real-time unread badge
  const { data: alertsRes } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 60000,
  });

  // Query health to display live system status
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: healthCheck,
    refetchInterval: 30000,
  });

  const alerts = alertsRes?.data ?? [];
  const unreadAlerts = alerts.filter(a => !a.is_read).length;
  const isHealthy = health?.status === 'healthy';
  const dataMode = alertsRes?.data_mode || 'demo';

  return (
    <TooltipProvider delay={100}>
      <div
        className={cn(
          "flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 relative select-none",
          isCollapsed ? "w-20" : "w-64",
          className
        )}
      >
        {/* Logo and Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0 group-hover:scale-105 transition-transform">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  TrafficSense <span className="text-blue-600 dark:text-blue-400">AI</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                  Bangalore Intelligence
                </span>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Platform
            </div>
          )}

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const hasAlertBadge = item.badgeKey === 'alerts' && unreadAlerts > 0;

            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <div className="relative shrink-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    )}
                  />
                  {hasAlertBadge && isCollapsed && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>

                {!isCollapsed && (
                  <span className="flex-1 truncate flex items-center justify-between">
                    <span>{item.name}</span>
                    {item.highlight && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> AI
                      </span>
                    )}
                    {hasAlertBadge && (
                      <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                        {unreadAlerts}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger render={linkContent} />
                  <TooltipContent side="right" className="font-medium text-xs">
                    {item.name}
                    {hasAlertBadge && ` (${unreadAlerts} unread)`}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Bottom Section: System Status & User Profile */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Status Indicator */}
          {!isCollapsed ? (
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    isHealthy ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  )} />
                  System {isHealthy ? 'Online' : 'Offline'}
                </span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                  dataMode === 'live' 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                )}>
                  {dataMode === 'live' ? 'LIVE' : 'DEMO'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-1.5">
                <span>Bangalore Grid</span>
                <span>v1.0.0</span>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="flex justify-center py-1 cursor-pointer">
                    <span className={cn(
                      "h-2.5 w-2.5 rounded-full ring-4",
                      isHealthy ? "bg-emerald-500 ring-emerald-100 dark:ring-emerald-950" : "bg-rose-500 ring-rose-100 dark:ring-rose-950"
                    )} />
                  </div>
                }
              />
              <TooltipContent side="right" className="text-xs">
                {isHealthy ? 'System Online (Healthy)' : 'Backend Offline'} • {dataMode.toUpperCase()}
              </TooltipContent>
            </Tooltip>
          )}

          {/* User Profile Card */}
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                BLR
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  Traffic Ops BLR
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  Command Center
                </div>
              </div>
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="flex justify-center cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-xs text-slate-700 dark:text-slate-200">
                      BLR
                    </div>
                  </div>
                }
              />
              <TooltipContent side="right" className="text-xs">
                Traffic Ops BLR • Command Center
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
