'use client';

import { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

/**
 * Client-only wallet button to prevent hydration errors
 */
export function WalletButton({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className={className || "wallet-adapter-button wallet-adapter-button-trigger"}>
        Select Wallet
      </button>
    );
  }

  return <WalletMultiButton className={className} />;
}
