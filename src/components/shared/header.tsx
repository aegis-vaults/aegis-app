'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Bell, Menu, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WalletButton } from './wallet-button';
import { CONFIG } from '@/lib/constants';
import { useUIStore } from '@/lib/stores/ui';
import Link from 'next/link';

export function Header() {
  const { connected } = useWallet();
  const { toggleMobileMenu } = useUIStore();

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-white/5 bg-aegis-bg-secondary/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden rounded-lg p-2 hover:bg-white/5 transition-colors -ml-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-aegis-text-secondary" />
          </button>

          {/* Mobile logo */}
          <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
            <Shield className="w-5 h-5 text-aegis-blue" />
            <span className="text-lg font-bold gradient-text">AEGIS</span>
          </Link>

          {/* Desktop title */}
          <h1 className="hidden lg:block text-lg font-semibold text-aegis-text-primary">Dashboard</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Network Indicator */}
          <Badge variant="outline" className="gap-1.5 sm:gap-2 px-2 sm:px-3 py-1">
            <div className={cn(
              "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
              CONFIG.SOLANA_NETWORK === 'devnet' ? 'bg-aegis-amber' : 'bg-aegis-emerald'
            )}></div>
            <span className="text-[10px] sm:text-xs hidden sm:inline">{CONFIG.SOLANA_NETWORK}</span>
          </Badge>

          {/* Notifications */}
          <button className="relative rounded-lg p-1.5 sm:p-2 hover:bg-white/5 transition-colors">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-aegis-text-secondary" />
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-aegis-crimson rounded-full"></span>
          </button>

          {/* Wallet Connection */}
          <WalletButton className="!text-xs sm:!text-sm !px-2 sm:!px-4 !py-1.5 sm:!py-2" />
        </div>
      </div>
    </header>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
