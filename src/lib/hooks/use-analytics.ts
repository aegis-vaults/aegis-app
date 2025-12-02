/**
 * Aegis Frontend - Analytics Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CACHE_TIMES } from '@/lib/constants';

// Global analytics
export function useGlobalAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => api.analytics.global(),
    staleTime: CACHE_TIMES.GLOBAL_ANALYTICS,
  });
}

// Vault analytics
export function useVaultAnalytics(vaultId: string, timeRange?: '7d' | '30d' | '90d') {
  return useQuery({
    queryKey: ['analytics', 'vault', vaultId, timeRange],
    queryFn: () => api.analytics.vault(vaultId, timeRange),
    staleTime: CACHE_TIMES.ANALYTICS,
    enabled: !!vaultId,
  });
}

// Spending trend
export function useSpendingTrend(vaultId: string, days?: number) {
  return useQuery({
    queryKey: ['analytics', 'spending-trend', vaultId, days],
    queryFn: () => api.analytics.spendingTrend(vaultId, days),
    staleTime: CACHE_TIMES.ANALYTICS,
    enabled: !!vaultId,
  });
}
