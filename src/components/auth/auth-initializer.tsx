'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

/**
 * AuthInitializer
 *
 * Automatically sets the API client userId when wallet connects/disconnects
 * This ensures all API requests include the x-user-id header for authentication
 */
export function AuthInitializer() {
  const { publicKey, connected } = useWallet();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (connected && publicKey) {
      // Set the user ID (wallet address) for API authentication
      apiClient.setUserId(publicKey.toString());
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } else {
      // Clear the user ID when wallet disconnects
      apiClient.setUserId(null);
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
    }
  }, [publicKey, connected, queryClient]);

  // This component doesn't render anything
  return null;
}
