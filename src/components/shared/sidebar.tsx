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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-sm',
          'hidden lg:block',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
          mobileMenuOpen && 'block w-72'
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-gray-100",
          sidebarCollapsed && !mobileMenuOpen ? "justify-center px-2" : "justify-between px-4"
        )}>
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-caldera-orange flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-black text-caldera-black">AEGIS</span>
            </Link>
          )}
          
          {sidebarCollapsed && !mobileMenuOpen && (
            <Link href="/dashboard" className="flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-caldera-orange flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </Link>
          )}
          
          {/* Desktop collapse toggle */}
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex rounded-lg p-2 hover:bg-gray-100 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-caldera-text-secondary" />
            </button>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-caldera-text-secondary" />
          </button>
        </div>

        {/* Expand button when collapsed - outside header */}
        {sidebarCollapsed && !mobileMenuOpen && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-5 rounded-full p-1.5 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors z-10"
            title="Expand sidebar"
          >
            <ChevronRight className="w-3 h-3 text-caldera-text-secondary" />
          </button>
        )}

        {/* Navigation */}
        <nav className={cn(
          "space-y-1",
          sidebarCollapsed && !mobileMenuOpen ? "p-2" : "p-3"
        )}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center rounded-xl transition-all duration-200',
                  sidebarCollapsed && !mobileMenuOpen 
                    ? 'justify-center p-2.5' 
                    : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-caldera-orange text-white font-semibold shadow-md shadow-caldera-orange/20'
                    : 'text-caldera-text-secondary hover:bg-gray-100 hover:text-caldera-text-primary'
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

        {/* Footer */}
        {(!sidebarCollapsed || mobileMenuOpen) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
            <p className="text-xs text-caldera-text-muted text-center">
              © 2024 Aegis Vaults
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
