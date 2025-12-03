'use client';

import { Sidebar } from '@/components/shared/sidebar';
import { Header } from '@/components/shared/header';
import { AuthInitializer } from '@/components/auth/auth-initializer';
import { useUIStore } from '@/lib/stores/ui';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-aegis-bg-primary">
      <AuthInitializer />
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
