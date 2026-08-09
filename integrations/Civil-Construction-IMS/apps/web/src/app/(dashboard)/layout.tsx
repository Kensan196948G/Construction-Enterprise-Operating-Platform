import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MockBanner } from '@/components/layout/mock-banner';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <MockBanner />
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
