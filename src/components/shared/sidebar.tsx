'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Vault, ArrowRightLeft, BarChart3, Shield, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/ui';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vaults', href: '/vaults', icon: Vault },
  { name: 'Transactions', href: '/transactions', icon: ArrowRightLeft },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Security', href: '/security', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-aegis-bg-secondary border-r border-white/5 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        {!sidebarCollapsed && (
          <span className="text-xl font-bold gradient-text">AEGIS</span>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 hover:bg-white/5 transition-colors"
        >
          <div className="w-4 h-3 flex flex-col justify-between">
            <div className="w-full h-0.5 bg-aegis-blue"></div>
            <div className="w-full h-0.5 bg-aegis-blue"></div>
            <div className="w-full h-0.5 bg-aegis-blue"></div>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-aegis-blue/20 text-aegis-blue border border-aegis-blue/30'
                  : 'text-aegis-text-secondary hover:bg-white/5 hover:text-aegis-text-primary'
              )}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
