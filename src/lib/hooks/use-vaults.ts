/**
 * Aegis Frontend - Vault Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '@/lib/api';
import { ListVaultsParams, UpdateVaultParams } from '@/types/api';
import { CACHE_TIMES } from '@/lib/constants';
import apiClient from '@/lib/api/client';

// List vaults
export function useVaults(params?: ListVaultsParams) {
  const { publicKey, connected } = useWallet();
  
  // Ensure userId is set before making requests that require auth
  if (connected && publicKey) {
    apiClient.setUserId(publicKey.toString());
  }
  
  return useQuery({
    queryKey: ['vaults', 'list', params, publicKey?.toString()],
    queryFn: () => api.vaults.list(params),
    staleTime: CACHE_TIMES.VAULTS_LIST,
    // Only run query if wallet is connected when myVaults is requested
    enabled: params?.myVaults ? connected && !!publicKey : true,
  });
}

// Get single vault
export function useVault(id: string) {
  return useQuery({
    queryKey: ['vaults', 'detail', id],
    queryFn: () => api.vaults.get(id),
    staleTime: CACHE_TIMES.VAULT,
    enabled: !!id,
  });
}

// Update vault mutation
export function useUpdateVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVaultParams }) =>
      api.vaults.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      queryClient.invalidateQueries({ queryKey: ['vaults', 'detail', variables.id] });
    },
  });
}

// Delete vault mutation
export function useDeleteVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.vaults.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
    },
  });
}
