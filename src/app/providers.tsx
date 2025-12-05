'use client';

/**
 * Aegis Frontend - App Providers
 */

import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { Toaster } from 'sonner';
import { CONFIG } from '@/lib/constants';

// Note: Wallet adapter styles are imported in globals.css to ensure proper CSS override order

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Performance optimizations
      staleTime: 30_000, // Data is fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes (was cacheTime)
      refetchOnMount: false, // Don't refetch if data is still fresh
      refetchOnReconnect: false, // Don't refetch on reconnect if fresh
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Configure Solana network
  const network = CONFIG.SOLANA_NETWORK as WalletAdapterNetwork;
  const endpoint = useMemo(() => CONFIG.SOLANA_RPC_URL, []);

  // Configure wallets
  // Note: Phantom now auto-registers via Standard Wallet API, so we don't need to explicitly add it
  // This prevents the "Phantom was registered as a Standard Wallet" warning
  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="top-right" richColors />
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
