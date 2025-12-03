'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Vault, ArrowRightLeft, BarChart3, Shield, Settings, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-aegis-bg-secondary border-r border-white/5 transition-all duration-300',
          // Desktop: show based on collapsed state
          'hidden lg:block',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
          // Mobile: slide in from left when open
          mobileMenuOpen && 'block w-72'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 border-b border-white/5">
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-aegis-blue" />
              <span className="text-xl font-bold gradient-text">AEGIS</span>
            </Link>
          )}
          
          {/* Desktop collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex rounded-lg p-2 hover:bg-white/5 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-aegis-text-secondary" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-aegis-text-secondary" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden rounded-lg p-2 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-aegis-text-secondary" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-aegis-blue/20 text-aegis-blue border border-aegis-blue/30'
                    : 'text-aegis-text-secondary hover:bg-white/5 hover:text-aegis-text-primary'
                )}
                title={sidebarCollapsed && !mobileMenuOpen ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!sidebarCollapsed || mobileMenuOpen) && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile footer */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <p className="text-xs text-aegis-text-tertiary text-center">
            © 2024 Aegis Vaults
          </p>
        </div>
      </aside>
    </>
  );
}
