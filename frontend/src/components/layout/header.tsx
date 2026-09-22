'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/sidebar';
import { useState } from 'react';

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/map': 'Traffic Map',
  '/analytics': 'Analytics',
  '/predictions': 'Predictions',
  '/routes': 'Route Planner',
  '/incidents': 'Incidents',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
};

export function Header() {
  const pathname = usePathname();
  const title = routeNames[pathname] || 'TrafficSense AI';
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar isMobile onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center justify-between">
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      </div>
    </header>
  );
}
