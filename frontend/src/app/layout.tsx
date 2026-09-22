import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TrafficSense AI',
  description: 'Intelligent traffic monitoring and prediction system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen w-full bg-muted/40">
            <aside className="hidden w-64 flex-col fixed inset-y-0 z-20 md:flex">
              <Sidebar />
            </aside>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 flex-1">
              <Header />
              <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
