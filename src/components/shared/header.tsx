'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WalletButton } from './wallet-button';
import { CONFIG } from '@/lib/constants';

export function Header() {
  const { connected } = useWallet();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-aegis-bg-secondary/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-aegis-text-primary">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Network Indicator */}
          <Badge variant="outline" className="gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              CONFIG.SOLANA_NETWORK === 'devnet' ? 'bg-aegis-amber' : 'bg-aegis-emerald'
            )}></div>
            <span className="text-xs">{CONFIG.SOLANA_NETWORK}</span>
          </Badge>

          {/* Notifications */}
          <button className="relative rounded-lg p-2 hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5 text-aegis-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-aegis-crimson rounded-full"></span>
          </button>

          {/* Wallet Connection */}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
