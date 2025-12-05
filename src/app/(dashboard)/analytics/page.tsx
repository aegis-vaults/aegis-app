'use client';

import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Activity, DollarSign, Wallet, Shield, AlertTriangle, CheckCircle, BarChart3, XCircle, Clock, Target } from 'lucide-react';
import { useVaults } from '@/lib/hooks/use-vaults';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { getConnection } from '@/lib/solana/config';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getVaultAuthorityPDA } from '@/lib/solana/program';
import { formatSol, formatAddress } from '@/lib/utils';
import { TransactionStatus } from '@/types/api';

export default function AnalyticsPage() {
  const { data: vaultsData, isLoading } = useVaults({ myVaults: true });
  const { data: transactionsData } = useTransactions({ myTransactions: true, pageSize: 100 });
  const vaults = useMemo(() => vaultsData?.data?.items || [], [vaultsData?.data?.items]);
  const allTransactions = useMemo(() => transactionsData?.data?.items || [], [transactionsData?.data?.items]);

  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const totalVaults = vaults.length;
  const activeVaults = vaults.filter((v) => !v.paused).length;
  const pausedVaults = vaults.filter((v) => v.paused).length;
  const totalDailyLimit = vaults.reduce((acc, v) => acc + Number(v.dailyLimit), 0);
  const totalDailySpent = vaults.reduce((acc, v) => acc + Number(v.dailySpent), 0);

  // Transaction metrics
  const totalTransactions = allTransactions.length;
  const executedTxs = allTransactions.filter(tx => tx.status === TransactionStatus.EXECUTED);
  const blockedTxs = allTransactions.filter(tx => tx.status === TransactionStatus.BLOCKED);
  const pendingTxs = allTransactions.filter(tx => tx.status === TransactionStatus.PENDING);

  const successRate = totalTransactions > 0
    ? ((executedTxs.length / totalTransactions) * 100).toFixed(1)
    : '0.0';

  const totalVolume = executedTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);

  // Top destinations analysis
  const destinationMap = new Map<string, { address: string; count: number; volume: number }>();
  executedTxs.forEach(tx => {
    const existing = destinationMap.get(tx.to) || { address: tx.to, count: 0, volume: 0 };
    destinationMap.set(tx.to, {
      address: tx.to,
      count: existing.count + 1,
      volume: existing.volume + Number(tx.amount),
    });
  });
  const topDestinations = Array.from(destinationMap.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  useEffect(() => {
    async function fetchTotalBalance() {
      if (vaults.length === 0) {
        setTotalBalance(0);
        setLoadingBalance(false);
        return;
      }

      setLoadingBalance(true);
      try {
        const connection = getConnection();

        // Fetch all balances in parallel for better performance
        const balancePromises = vaults.map(async (vault) => {
          try {
            const vaultPubkey = new PublicKey(vault.publicKey);
            const [vaultAuthority] = getVaultAuthorityPDA(vaultPubkey);
            const balance = await connection.getBalance(vaultAuthority);
            return balance / LAMPORTS_PER_SOL;
          } catch (e) {
            console.error('Error fetching balance for vault:', vault.id, e);
            return 0;
          }
        });

        const balances = await Promise.all(balancePromises);
        const total = balances.reduce((sum, balance) => sum + balance, 0);
        setTotalBalance(total);
      } catch (error) {
        console.error('Error fetching total balance:', error);
      } finally {
        setLoadingBalance(false);
      }
    }

    if (vaults.length > 0) {
      fetchTotalBalance();
    } else if (!isLoading) {
      setLoadingBalance(false);
    }
  }, [vaults, isLoading]);

  const spentPercentage = totalDailyLimit > 0
    ? ((totalDailySpent / totalDailyLimit) * 100).toFixed(1)
    : '0';

  // Debug logging for daily spending calculation
  if (process.env.NODE_ENV === 'development' && totalVaults > 0) {
    console.log('Daily Spending Debug:', {
      totalDailyLimit,
      totalDailySpent,
      spentPercentage,
      vaultDetails: vaults.map(v => ({
        name: v.name || 'Unnamed',
        limit: v.dailyLimit,
        spent: v.dailySpent,
        percentage: Number(v.dailyLimit) > 0
          ? ((Number(v.dailySpent) / Number(v.dailyLimit)) * 100).toFixed(1)
          : '0'
      }))
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-caldera-orange/20 border-t-caldera-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black text-caldera-black">Analytics</h1>
        <p className="text-caldera-text-secondary mt-1">Insights and metrics for your vaults</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-caldera-success" />
            </div>
          </div>
          <div className="text-2xl font-display font-black text-caldera-success">
            {loadingBalance ? 'Loading...' : `${totalBalance.toFixed(4)} SOL`}
          </div>
          <p className="text-sm text-caldera-text-muted mt-1">
            Total Balance ({totalVaults} vaults)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-info/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-caldera-info" />
            </div>
          </div>
          <div className="text-2xl font-display font-black text-caldera-black">
            {formatSol(totalDailyLimit.toString())} SOL
          </div>
          <p className="text-sm text-caldera-text-muted mt-1">
            Daily Limit ({spentPercentage}% used)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-caldera-purple" />
            </div>
          </div>
          <div className="text-2xl font-display font-black text-caldera-black">
            {totalTransactions}
          </div>
          <p className="text-sm text-caldera-text-muted mt-1">
            Total Transactions
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-caldera-orange" />
            </div>
          </div>
          <div className="text-2xl font-display font-black text-caldera-orange">
            {formatSol(totalDailySpent.toString())} SOL
          </div>
          <p className="text-sm text-caldera-text-muted mt-1">
            Spent Today
          </p>
        </div>
      </div>

      {/* Vault Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-caldera-info/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-caldera-info" />
            </div>
            <div>
              <p className="text-3xl font-display font-black text-caldera-black">{totalVaults}</p>
              <p className="text-sm text-caldera-text-muted">Total Vaults</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-caldera-success" />
            </div>
            <div>
              <p className="text-3xl font-display font-black text-caldera-success">{activeVaults}</p>
              <p className="text-sm text-caldera-text-muted">Active Vaults</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-caldera-orange" />
            </div>
            <div>
              <p className="text-3xl font-display font-black text-caldera-orange">{pausedVaults}</p>
              <p className="text-sm text-caldera-text-muted">Paused Vaults</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Progress */}
      {totalVaults > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-caldera-purple" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-caldera-black">Daily Spending Progress</h2>
                <p className="text-sm text-caldera-text-muted">Combined daily limit usage across all vaults</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-caldera-text-secondary">
                {formatSol(totalDailySpent.toString())} / {formatSol(totalDailyLimit.toString())} SOL
              </span>
              <span className="font-semibold text-caldera-black">{spentPercentage}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-caldera-orange to-caldera-purple rounded-full transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(spentPercentage), 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-caldera-text-muted">
                Resets daily at midnight UTC
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-caldera-text-muted font-mono">
                  Debug: {totalDailySpent.toFixed(9)} / {totalDailyLimit.toFixed(9)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Analytics */}
      {totalTransactions > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Status Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-caldera-purple" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-caldera-black">Transaction Metrics</h2>
                  <p className="text-sm text-caldera-text-muted">{totalTransactions} total transactions</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-caldera-success/5 border border-caldera-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-caldera-success" />
                    <span className="text-xs font-medium text-caldera-success uppercase tracking-wide">Executed</span>
                  </div>
                  <p className="text-2xl font-display font-black text-caldera-success">{executedTxs.length}</p>
                  <p className="text-xs text-caldera-text-muted mt-1">{formatSol(totalVolume.toString())} SOL volume</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-600 uppercase tracking-wide">Blocked</span>
                  </div>
                  <p className="text-2xl font-display font-black text-red-600">{blockedTxs.length}</p>
                  <p className="text-xs text-caldera-text-muted mt-1">
                    {totalTransactions > 0 ? ((blockedTxs.length / totalTransactions) * 100).toFixed(1) : '0'}% of total
                  </p>
                </div>
              </div>
              {pendingTxs.length > 0 && (
                <div className="p-4 rounded-xl bg-caldera-yellow/10 border border-caldera-yellow/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-700" />
                    <span className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Pending</span>
                  </div>
                  <p className="text-2xl font-display font-black text-yellow-700">{pendingTxs.length}</p>
                </div>
              )}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-caldera-text-secondary">Success Rate</span>
                  <span className="text-2xl font-display font-black text-caldera-black">{successRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Destinations */}
          {topDestinations.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-caldera-info/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-caldera-info" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-caldera-black">Top Destinations</h2>
                    <p className="text-sm text-caldera-text-muted">Most frequent recipients</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {topDestinations.map((dest, index) => (
                    <div key={dest.address} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-caldera-info/10 flex items-center justify-center text-sm font-bold text-caldera-info">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-mono text-sm text-caldera-black">{formatAddress(dest.address, 4)}</p>
                          <p className="text-xs text-caldera-text-muted">{dest.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-caldera-black">{formatSol(dest.volume.toString())} SOL</p>
                        <p className="text-xs text-caldera-text-muted">
                          {totalVolume > 0 ? ((dest.volume / totalVolume) * 100).toFixed(1) : '0'}% of volume
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Per-Vault Breakdown */}
      {vaults.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-display font-bold text-caldera-black">Vault Breakdown</h2>
            <p className="text-sm text-caldera-text-muted">Individual vault metrics</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {vaults.map((vault) => {
                const vaultSpentPercent = Number(vault.dailyLimit) > 0 
                  ? ((Number(vault.dailySpent) / Number(vault.dailyLimit)) * 100).toFixed(1)
                  : '0';
                
                return (
                  <div key={vault.id} className="p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-caldera-black">
                          {vault.name || 'Unnamed Vault'}
                        </span>
                        {vault.paused && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-caldera-orange/10 text-caldera-orange font-medium">
                            Paused
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-caldera-text-secondary">
                        {vault.transactions?.length || 0} transactions
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-caldera-text-muted mb-2">
                      <span>Daily: {formatSol(vault.dailySpent)} / {formatSol(vault.dailyLimit)} SOL</span>
                      <span>{vaultSpentPercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          vault.paused 
                            ? 'bg-gray-400' 
                            : 'bg-gradient-to-r from-caldera-orange to-caldera-purple'
                        }`}
                        style={{ width: `${Math.min(parseFloat(vaultSpentPercent), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {vaults.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <Activity className="w-10 h-10 text-caldera-text-muted" />
            </div>
            <h3 className="text-xl font-display font-bold text-caldera-black mb-2">No Analytics Yet</h3>
            <p className="text-caldera-text-secondary max-w-md">
              Create your first vault to start tracking analytics and insights.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
