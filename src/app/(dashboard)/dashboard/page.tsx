'use client';

import { useVaults } from '@/lib/hooks/use-vaults';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { Badge } from '@/components/ui/badge';
import { formatSol, formatRelativeTime, formatAddress } from '@/lib/utils';
import { TransactionStatus } from '@/types/api';
import { Vault, ArrowRightLeft, TrendingUp, Coins, Shield, Activity, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: vaultsData, isLoading: vaultsLoading } = useVaults({ myVaults: true });
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({ pageSize: 10, myTransactions: true });

  const vaults = vaultsData?.data?.items || [];
  const transactions = transactionsData?.data?.items || [];

  const totalVaults = vaults.length;
  const activeVaults = vaults.filter(v => v.isActive && !v.paused).length;
  const totalBalance = vaults.reduce((sum, v) => sum + Number(v.dailyLimit), 0);
  const totalTransactions = transactions.length;

  // Calculate actual success rate from transactions
  const successfulTransactions = transactions.filter(tx => tx.status === TransactionStatus.EXECUTED).length;
  const successRate = totalTransactions > 0
    ? ((successfulTransactions / totalTransactions) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-black text-caldera-black">
          Welcome Back
        </h1>
        <p className="text-caldera-text-secondary mt-1">
          Here&apos;s what&apos;s happening with your vaults today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
              <Vault className="w-5 h-5 text-caldera-orange" />
            </div>
            <span className="text-xs font-medium text-caldera-success bg-caldera-success/10 px-2 py-1 rounded-full">
              {activeVaults} active
            </span>
          </div>
          <div className="text-3xl font-display font-black text-caldera-black">
            {totalVaults}
          </div>
          <p className="text-sm text-caldera-text-muted mt-1">Total Vaults</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-caldera-success" />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-caldera-black">
            {formatSol(totalBalance.toString())}
          </div>
          <p className="text-sm text-caldera-text-muted mt-1">Daily Limit (SOL)</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-caldera-purple" />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-caldera-black">
            {totalTransactions}
          </div>
          <p className="text-sm text-caldera-text-muted mt-1">Recent Transactions</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-info/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-caldera-info" />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-caldera-black">
            {successRate}<span className="text-xl text-caldera-text-muted">%</span>
          </div>
          <p className="text-sm text-caldera-text-muted mt-1">
            Success Rate {totalTransactions > 0 && `(${successfulTransactions}/${totalTransactions})`}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Vaults List */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-caldera-orange" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-caldera-black">Your Vaults</h2>
                <p className="text-sm text-caldera-text-muted">{vaults.length} total</p>
              </div>
            </div>
            <Link 
              href="/vaults"
              className="text-sm font-medium text-caldera-orange hover:text-caldera-orange-secondary flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="p-6">
            {vaultsLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-caldera-orange/20 border-t-caldera-orange" />
              </div>
            ) : vaults.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-caldera-text-muted" />
                </div>
                <p className="text-caldera-text-secondary font-medium">No vaults yet</p>
                <p className="text-sm text-caldera-text-muted mt-1">
                  Create your first vault to get started
                </p>
                <Link href="/vaults">
                  <button className="mt-4 px-4 py-2 bg-caldera-orange text-white rounded-xl text-sm font-medium hover:bg-caldera-orange-secondary transition-colors">
                    Create Vault
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {vaults.slice(0, 5).map((vault, idx) => (
                  <Link
                    key={vault.id}
                    href={`/vaults/${vault.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-caldera-text-muted">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-caldera-black group-hover:text-caldera-orange transition-colors">
                          {vault.name || formatAddress(vault.publicKey)}
                        </p>
                        <p className="text-sm text-caldera-text-muted">
                          {formatSol(vault.dailyLimit)} SOL daily limit
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={vault.paused ? 'outline' : 'default'}
                        className={vault.paused
                          ? 'text-caldera-text-muted border-gray-300'
                          : 'bg-caldera-success/10 text-caldera-success border-caldera-success/20'
                        }
                      >
                        {vault.paused ? 'Paused' : 'Active'}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-caldera-text-muted group-hover:text-caldera-orange transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-caldera-purple" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-caldera-black">Activity</h2>
                <p className="text-sm text-caldera-text-muted">Recent transactions</p>
              </div>
            </div>
            <Link 
              href="/transactions"
              className="text-sm font-medium text-caldera-purple hover:text-caldera-purple/80 flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="p-6">
            {transactionsLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-caldera-purple/20 border-t-caldera-purple" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft className="w-8 h-8 text-caldera-text-muted" />
                </div>
                <p className="text-caldera-text-secondary font-medium">No transactions</p>
                <p className="text-sm text-caldera-text-muted mt-1">
                  Transactions will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-caldera-black">
                        {formatAddress(tx.to)}
                      </span>
                      <Badge
                        className={tx.status === TransactionStatus.EXECUTED
                          ? 'bg-caldera-success/10 text-caldera-success border-caldera-success/20'
                          : 'bg-caldera-orange/10 text-caldera-orange border-caldera-orange/20'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-caldera-text-muted">
                        {formatRelativeTime(tx.createdAt)}
                      </span>
                      <span className="font-medium text-caldera-black">
                        {formatSol(tx.amount)} SOL
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-caldera-success">
              <span className="w-2 h-2 rounded-full bg-caldera-success" />
              System Online
            </span>
            <span className="text-caldera-text-muted">Protocol v1.0.0</span>
            <span className="text-caldera-text-muted">Mainnet</span>
          </div>
          <span className="text-caldera-text-muted">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
