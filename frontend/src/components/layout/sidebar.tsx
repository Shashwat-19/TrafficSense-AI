'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  LineChart, 
  Route, 
  AlertTriangle, 
  BellRing, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DataModeIndicator } from '@/components/traffic/data-mode-indicator';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Traffic Map', href: '/map', icon: Map },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Predictions', href: '/predictions', icon: LineChart },
  { name: 'Route Planner', href: '/routes', icon: Route },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Alerts', href: '/alerts', icon: BellRing },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ className, isMobile, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      <div className="p-6 flex items-center gap-2">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
          <Map className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg tracking-tight">TrafficSense AI</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} onClick={onNavigate}>
              <span
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <DataModeIndicator mode="demo" className="w-full justify-center" />
      </div>
    </div>
  );
}
