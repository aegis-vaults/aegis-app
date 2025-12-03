'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Activity, DollarSign, Wallet, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
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

  // Calculate aggregate metrics
  const totalVaults = vaults.length;
  const activeVaults = vaults.filter((v) => !v.paused).length;
  const pausedVaults = vaults.filter((v) => v.paused).length;
  const totalDailyLimit = vaults.reduce((acc, v) => acc + Number(v.dailyLimit), 0);
  const totalDailySpent = vaults.reduce((acc, v) => acc + Number(v.dailySpent), 0);
  const totalTransactions = vaults.reduce((acc, v) => acc + (v.transactions?.length || 0), 0);

  // Fetch total balance across all vaults
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
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-aegis-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-aegis-text-primary">Analytics</h1>
        <p className="text-aegis-text-secondary mt-1">Insights and metrics for your vaults</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-aegis-emerald" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-aegis-emerald">
              {loadingBalance ? 'Loading...' : `${totalBalance.toFixed(4)} SOL`}
            </div>
            <p className="text-xs text-aegis-text-tertiary">
              Across {totalVaults} vault{totalVaults !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Limit</CardTitle>
            <TrendingUp className="h-4 w-4 text-aegis-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-aegis-text-primary">
              {formatSol(totalDailyLimit.toString())} SOL
            </div>
            <p className="text-xs text-aegis-text-tertiary">
              {spentPercentage}% used today
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-aegis-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-aegis-text-primary">
              {totalTransactions}
            </div>
            <p className="text-xs text-aegis-text-tertiary">
              All time across all vaults
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-aegis-amber" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-aegis-amber">
              {formatSol(totalDailySpent.toString())} SOL
            </div>
            <p className="text-xs text-aegis-text-tertiary">
              Today&apos;s spending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vault Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vaults</CardTitle>
            <Shield className="h-4 w-4 text-aegis-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-aegis-text-primary">{totalVaults}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vaults</CardTitle>
            <CheckCircle className="h-4 w-4 text-aegis-emerald" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-aegis-emerald">{activeVaults}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Vaults</CardTitle>
            <AlertTriangle className="h-4 w-4 text-aegis-crimson" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-aegis-crimson">{pausedVaults}</div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Progress */}
      {totalVaults > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Daily Spending Progress</CardTitle>
            <CardDescription>
              Combined daily limit usage across all vaults
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-aegis-text-secondary">
                  {formatSol(totalDailySpent.toString())} / {formatSol(totalDailyLimit.toString())} SOL
                </span>
                <span className="text-aegis-text-primary font-medium">{spentPercentage}%</span>
              </div>
              <div className="h-4 bg-aegis-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-aegis-emerald to-aegis-blue transition-all duration-500"
                  style={{ width: `${Math.min(parseFloat(spentPercentage), 100)}%` }}
                />
              </div>
              <p className="text-xs text-aegis-text-tertiary">
                Resets daily at midnight UTC
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Vault Breakdown */}
      {vaults.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Vault Breakdown</CardTitle>
            <CardDescription>Individual vault metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vaults.map((vault) => {
                const vaultSpentPercent = Number(vault.dailyLimit) > 0 
                  ? ((Number(vault.dailySpent) / Number(vault.dailyLimit)) * 100).toFixed(1)
                  : '0';
                
                return (
                  <div key={vault.id} className="p-4 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-aegis-text-primary">
                          {vault.name || 'Unnamed Vault'}
                        </span>
                        {vault.paused && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-aegis-crimson/20 text-aegis-crimson">
                            Paused
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-aegis-text-secondary">
                        {vault.transactions?.length || 0} transactions
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-aegis-text-tertiary mb-1">
                      <span>Daily: {formatSol(vault.dailySpent)} / {formatSol(vault.dailyLimit)} SOL</span>
                      <span>{vaultSpentPercent}%</span>
                    </div>
                    <div className="h-2 bg-aegis-bg-primary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          vault.paused 
                            ? 'bg-aegis-text-tertiary' 
                            : 'bg-gradient-to-r from-aegis-emerald to-aegis-blue'
                        }`}
                        style={{ width: `${Math.min(parseFloat(vaultSpentPercent), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {vaults.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-aegis-text-tertiary mb-4" />
            <h3 className="text-lg font-medium text-aegis-text-primary mb-2">No Analytics Yet</h3>
            <p className="text-aegis-text-secondary text-center max-w-md">
              Create your first vault to start tracking analytics and insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
