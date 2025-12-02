/**
 * Aegis Frontend - Transaction Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ListTransactionsParams } from '@/types/api';
import { CACHE_TIMES } from '@/lib/constants';

// List transactions
export function useTransactions(params?: ListTransactionsParams) {
  return useQuery({
    queryKey: ['transactions', 'list', params],
    queryFn: () => api.transactions.list(params),
    staleTime: CACHE_TIMES.TRANSACTIONS_LIST,
  });
}

// Get single transaction
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', 'detail', id],
    queryFn: () => api.transactions.get(id),
    staleTime: CACHE_TIMES.TRANSACTION,
    enabled: !!id,
  });
}
