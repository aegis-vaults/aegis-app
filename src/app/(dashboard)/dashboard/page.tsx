'use client';

import { useVaults } from '@/lib/hooks/use-vaults';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatSol, formatRelativeTime, formatAddress } from '@/lib/utils';
import { TransactionStatus } from '@/types/api';
import { Vault, ArrowRightLeft, TrendingUp, Coins } from 'lucide-react';

export default function DashboardPage() {
  const { data: vaultsData, isLoading: vaultsLoading } = useVaults();
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({ pageSize: 10 });

  const vaults = vaultsData?.data?.items || [];
  const transactions = transactionsData?.data?.items || [];

  // Calculate stats
  const totalVaults = vaults.length;
  const activeVaults = vaults.filter(v => v.isActive && !v.paused).length;
  const totalBalance = vaults.reduce((sum, v) => sum + Number(v.dailyLimit), 0);
  const totalTransactions = transactions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-aegis-text-primary">Dashboard</h1>
        <p className="text-aegis-text-secondary mt-1">Overview of your Aegis vaults and activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vaults</CardTitle>
            <Vault className="h-4 w-4 text-aegis-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVaults}</div>
            <p className="text-xs text-aegis-text-tertiary">
              {activeVaults} active
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Limit</CardTitle>
            <Coins className="h-4 w-4 text-aegis-emerald" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSol(totalBalance.toString())} SOL</div>
            <p className="text-xs text-aegis-text-tertiary">
              Combined daily limits
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-aegis-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-aegis-text-tertiary">
              Recent activity
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-aegis-amber" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.5%</div>
            <p className="text-xs text-aegis-text-tertiary">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vaults List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Your Vaults</CardTitle>
          </CardHeader>
          <CardContent>
            {vaultsLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-aegis-blue border-t-transparent"></div>
              </div>
            ) : vaults.length === 0 ? (
              <div className="text-center py-8 text-aegis-text-secondary">
                No vaults yet. Create your first vault to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {vaults.slice(0, 5).map((vault) => (
                  <div
                    key={vault.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-aegis-bg-tertiary/50 hover:bg-aegis-bg-tertiary transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-aegis-text-primary">
                        {vault.name || formatAddress(vault.publicKey)}
                      </div>
                      <div className="text-sm text-aegis-text-tertiary">
                        {formatSol(vault.dailyLimit)} SOL daily limit
                      </div>
                    </div>
                    <Badge variant={vault.paused ? 'outline' : 'default'}>
                      {vault.paused ? 'Paused' : 'Active'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-aegis-blue border-t-transparent"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-aegis-text-secondary">
                No transactions yet.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-aegis-bg-tertiary/50 hover:bg-aegis-bg-tertiary transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-aegis-text-primary">
                          {formatAddress(tx.to)}
                        </span>
                        <Badge
                          variant={tx.status === TransactionStatus.EXECUTED ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-aegis-text-tertiary mt-1">
                        {formatRelativeTime(tx.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-aegis-text-primary">
                        {formatSol(tx.amount)} SOL
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
