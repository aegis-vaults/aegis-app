/**
 * Hook for monitoring AI agent wallet balances
 * Commercial feature: Alerts when agent needs gas money
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConnection } from '@/lib/solana/config';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CACHE_TIMES } from '@/lib/constants';

interface AgentBalanceResult {
  balance: number; // in SOL
  balanceLamports: number;
  isLow: boolean; // < 0.01 SOL
  isCritical: boolean; // < 0.005 SOL
  status: 'healthy' | 'low' | 'critical';
  estimatedTransactions: number; // Estimated txs remaining (assuming 5000 lamports per tx)
}

const MIN_BALANCE_LOW = 0.01; // 0.01 SOL = low warning
const MIN_BALANCE_CRITICAL = 0.005; // 0.005 SOL = critical warning
const ESTIMATED_TX_COST = 5000; // lamports per transaction (conservative estimate)

/**
 * Fetch balance for a single agent wallet
 */
export function useAgentBalance(agentPublicKey?: string) {
  return useQuery<AgentBalanceResult>({
    queryKey: ['agent-balance', agentPublicKey],
    queryFn: async () => {
      if (!agentPublicKey) {
        return {
          balance: 0,
          balanceLamports: 0,
          isLow: true,
          isCritical: true,
          status: 'critical' as const,
          estimatedTransactions: 0,
        };
      }

      try {
        const connection = getConnection();
        const pubkey = new PublicKey(agentPublicKey);
        const balanceLamports = await connection.getBalance(pubkey);
        const balance = balanceLamports / LAMPORTS_PER_SOL;

        const isLow = balance < MIN_BALANCE_LOW;
        const isCritical = balance < MIN_BALANCE_CRITICAL;
        const estimatedTransactions = Math.floor(balanceLamports / ESTIMATED_TX_COST);

        let status: 'healthy' | 'low' | 'critical';
        if (isCritical) {
          status = 'critical';
        } else if (isLow) {
          status = 'low';
        } else {
          status = 'healthy';
        }

        return {
          balance,
          balanceLamports,
          isLow,
          isCritical,
          status,
          estimatedTransactions,
        };
      } catch (error) {
        console.error('Error fetching agent balance:', error);
        throw error;
      }
    },
    enabled: !!agentPublicKey,
    staleTime: CACHE_TIMES.VAULT, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time monitoring
  });
}

/**
 * Fetch balances for multiple agents at once using batch RPC call
 * This is much faster than individual getBalance calls
 */
export function useMultipleAgentBalances(agentPublicKeys: string[]) {
  return useQuery<Record<string, AgentBalanceResult>>({
    queryKey: ['agent-balances', agentPublicKeys.sort().join(',')],
    queryFn: async () => {
      if (agentPublicKeys.length === 0) {
        return {};
      }

      const connection = getConnection();
      const results: Record<string, AgentBalanceResult> = {};

      try {
        // Convert all keys to PublicKeys
        const pubkeys = agentPublicKeys.map(key => new PublicKey(key));
        
        // Use getMultipleAccountsInfo for batch fetching (single RPC call!)
        // This is MUCH faster than individual getBalance calls
        const accounts = await connection.getMultipleAccountsInfo(pubkeys);
        
        accounts.forEach((account, index) => {
          const agentKey = agentPublicKeys[index];
          const balanceLamports = account?.lamports || 0;
          const balance = balanceLamports / LAMPORTS_PER_SOL;

          const isLow = balance < MIN_BALANCE_LOW;
          const isCritical = balance < MIN_BALANCE_CRITICAL;
          const estimatedTransactions = Math.floor(balanceLamports / ESTIMATED_TX_COST);

          let status: 'healthy' | 'low' | 'critical';
          if (isCritical) {
            status = 'critical';
          } else if (isLow) {
            status = 'low';
          } else {
            status = 'healthy';
          }

          results[agentKey] = {
            balance,
            balanceLamports,
            isLow,
            isCritical,
            status,
            estimatedTransactions,
          };
        });
      } catch (error) {
        console.error('Error fetching agent balances:', error);
        // Return empty results for all agents on error
        agentPublicKeys.forEach(agentKey => {
          results[agentKey] = {
            balance: 0,
            balanceLamports: 0,
            isLow: true,
            isCritical: true,
            status: 'critical' as const,
            estimatedTransactions: 0,
          };
        });
      }

      return results;
    },
    enabled: agentPublicKeys.length > 0,
    staleTime: 60_000, // Cache for 60 seconds (balances don't change that often)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Get status color for agent balance
 */
export function getAgentBalanceColor(status: 'healthy' | 'low' | 'critical'): string {
  switch (status) {
    case 'healthy':
      return 'text-caldera-success';
    case 'low':
      return 'text-yellow-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get background color for agent balance status
 */
export function getAgentBalanceBgColor(status: 'healthy' | 'low' | 'critical'): string {
  switch (status) {
    case 'healthy':
      return 'bg-caldera-success/10';
    case 'low':
      return 'bg-yellow-50';
    case 'critical':
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
}

/**
 * Get border color for agent balance status
 */
export function getAgentBalanceBorderColor(status: 'healthy' | 'low' | 'critical'): string {
  switch (status) {
    case 'healthy':
      return 'border-caldera-success/20';
    case 'low':
      return 'border-yellow-200';
    case 'critical':
      return 'border-red-200';
    default:
      return 'border-gray-200';
  }
}
