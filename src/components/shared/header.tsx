'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Bell, Menu, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WalletButton } from './wallet-button';
import { CONFIG } from '@/lib/constants';
import { useUIStore } from '@/lib/stores/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/vaults': 'Vaults',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/security': 'Security',
  '/settings': 'Settings',
};

export function Header() {
  const { connected } = useWallet();
  const { toggleMobileMenu } = useUIStore();
  const pathname = usePathname();
  
  const pageTitle = PAGE_TITLES[pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden rounded-xl p-2 hover:bg-gray-100 transition-colors -ml-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-caldera-text-secondary" />
          </button>

          {/* Mobile logo */}
          <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-caldera-orange flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </Link>

          {/* Desktop title */}
          <h1 className="hidden lg:block text-xl font-display font-bold text-caldera-black">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Network Indicator */}
          <Badge 
            variant="outline" 
            className="gap-2 px-3 py-1.5 border-gray-200 bg-white rounded-full"
          >
            <div className={`w-2 h-2 rounded-full ${
              CONFIG.SOLANA_NETWORK === 'devnet' ? 'bg-caldera-yellow' : 'bg-caldera-success'
            }`} />
            <span className="text-xs text-caldera-text-secondary font-medium hidden sm:inline">
              {CONFIG.SOLANA_NETWORK}
            </span>
          </Badge>

          {/* Notifications */}
          <button className="relative rounded-xl p-2 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-caldera-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-caldera-orange rounded-full" />
          </button>

          {/* Wallet Connection */}
          <WalletButton className="!text-sm !px-4 !py-2 !bg-caldera-orange hover:!bg-caldera-orange-secondary !rounded-full !font-semibold !shadow-md !shadow-caldera-orange/20" />
        </div>
      </div>
    </header>
  );
}
