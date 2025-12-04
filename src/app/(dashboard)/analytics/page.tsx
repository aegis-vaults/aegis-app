'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Activity, DollarSign, Wallet, Shield, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { useVaults } from '@/lib/hooks/use-vaults';
import { getConnection } from '@/lib/solana/config';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getVaultAuthorityPDA } from '@/lib/solana/program';
import { formatSol } from '@/lib/utils';

export default function AnalyticsPage() {
  const { data: vaultsData, isLoading } = useVaults({ myVaults: true });
  const vaults = vaultsData?.data?.items || [];

  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const totalVaults = vaults.length;
  const activeVaults = vaults.filter((v) => !v.paused).length;
  const pausedVaults = vaults.filter((v) => v.paused).length;
  const totalDailyLimit = vaults.reduce((acc, v) => acc + Number(v.dailyLimit), 0);
  const totalDailySpent = vaults.reduce((acc, v) => acc + Number(v.dailySpent), 0);
  const totalTransactions = vaults.reduce((acc, v) => acc + (v.transactions?.length || 0), 0);

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
        let total = 0;

        for (const vault of vaults) {
          try {
            const vaultPubkey = new PublicKey(vault.publicKey);
            const [vaultAuthority] = getVaultAuthorityPDA(vaultPubkey);
            const balance = await connection.getBalance(vaultAuthority);
            total += balance / LAMPORTS_PER_SOL;
          } catch (e) {
            console.error('Error fetching balance for vault:', vault.id, e);
          }
        }

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
            <p className="text-xs text-caldera-text-muted mt-3">
              Resets daily at midnight UTC
            </p>
          </div>
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
