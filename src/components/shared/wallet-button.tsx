'use client';

import { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

/**
 * Client-only wallet button to prevent hydration errors
 * 
 * Use variant="hero" for large buttons matching the landing page CTA style
 */
export function WalletButton({ 
  className,
  variant = 'default'
}: { 
  className?: string;
  variant?: 'default' | 'hero';
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHero = variant === 'hero' || className?.includes('hero-wallet-button');

  if (isHero) {
    if (!mounted) {
      return (
        <button 
          className="wallet-adapter-button wallet-adapter-button-trigger hero-wallet-button"
          style={{
            height: '56px',
            minHeight: '56px',
            padding: '0 40px',
            fontSize: '18px',
            borderRadius: '9999px',
            lineHeight: '56px',
          }}
        >
          Select Wallet
        </button>
      );
    }
    // Wrap in a span with data attribute for CSS targeting, span has no default styling
    return (
      <span data-wallet-hero="">
        <WalletMultiButton className="hero-wallet-button" />
      </span>
    );
  }

  if (!mounted) {
    return (
      <button className={`wallet-adapter-button wallet-adapter-button-trigger ${className || ''}`}>
        Select Wallet
      </button>
    );
  }

  return <WalletMultiButton className={className} />;
}
