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
    <div className="min-h-screen bg-caldera-light-gray">
      <AuthInitializer />
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          'ml-0 lg:ml-64',
          sidebarCollapsed && 'lg:ml-16'
        )}
      >
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
