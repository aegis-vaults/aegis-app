'use client';

import { useMemo, useState } from 'react';
import { useVaults } from '@/lib/hooks/use-vaults';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useMultipleAgentBalances, getAgentBalanceColor, getAgentBalanceBgColor, getAgentBalanceBorderColor } from '@/lib/hooks/use-agent-balance';
import { calculateVaultHealth, getHealthScoreColor, getHealthScoreBgColor, getHealthStatusColor, VaultHealthMetrics } from '@/lib/utils/vault-health';
import { Badge } from '@/components/ui/badge';
import { formatSol, formatRelativeTime, formatAddress, unique } from '@/lib/utils';
import { TransactionStatus, Vault as VaultType } from '@/types/api';
import {
  Vault,
  ArrowRightLeft,
  TrendingUp,
  Coins,
  Shield,
  Activity,
  ChevronRight,
  Plus,
  Pause,
  Wallet,
  Download,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  TrendingDown,
  CircleDot,
  Zap,
  Users,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function DashboardPage() {
  const { data: vaultsData, isLoading: vaultsLoading } = useVaults({ myVaults: true });
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({ pageSize: 10, myTransactions: true });

  const vaults = useMemo(() => vaultsData?.data?.items || [], [vaultsData?.data?.items]);
  const transactions = useMemo(() => transactionsData?.data?.items || [], [transactionsData?.data?.items]);

  // Extract unique agent signers from all vaults
  const agentPublicKeys = useMemo(() => {
    return unique(vaults.map(v => v.agentSigner).filter(Boolean));
  }, [vaults]);

  const { data: agentBalances } = useMultipleAgentBalances(agentPublicKeys);

  // State for dismissable alerts
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Calculate vault health metrics for each vault
  const vaultHealthData = useMemo(() => {
    return vaults.map(vault => {
      const vaultTransactions = transactions.filter(tx => tx.vaultId === vault.id);
      const agentBalance = agentBalances?.[vault.agentSigner]?.balance || 0;

      const health = calculateVaultHealth({
        vaultBalance: 0, // We don't have vault balance in the current data
        agentBalance,
        dailyLimit: Number(vault.dailyLimit),
        dailySpent: Number(vault.dailySpent),
        isPaused: vault.paused,
        lastActivityTimestamp: vaultTransactions.length > 0
          ? new Date(vaultTransactions[0].createdAt).getTime()
          : undefined,
        totalTransactions: vaultTransactions.length,
        successfulTransactions: vaultTransactions.filter(tx => tx.status === TransactionStatus.EXECUTED).length,
        blockedTransactions: vaultTransactions.filter(tx => tx.status === TransactionStatus.BLOCKED).length,
        hasWhitelist: vault.whitelistEnabled,
        whitelistCount: vault.whitelist.length,
        hasAgentSigner: !!vault.agentSigner,
      });

      return {
        vault,
        health,
        agentBalance,
      };
    });
  }, [vaults, transactions, agentBalances]);

  // Calculate aggregate metrics
  const totalVaults = vaults.length;
  const activeVaults = vaults.filter(v => v.isActive && !v.paused).length;
  const pausedVaults = vaults.filter(v => v.paused).length;
  const totalBalance = vaults.reduce((sum, v) => sum + Number(v.dailyLimit), 0);

  const successfulTransactions = transactions.filter(tx => tx.status === TransactionStatus.EXECUTED).length;
  const blockedTransactions = transactions.filter(tx => tx.status === TransactionStatus.BLOCKED).length;
  const successRate = transactions.length > 0
    ? ((successfulTransactions / transactions.length) * 100).toFixed(1)
    : '0.0';

  // Calculate average health score
  const averageHealth = vaultHealthData.length > 0
    ? Math.round(vaultHealthData.reduce((sum, { health }) => sum + health.score, 0) / vaultHealthData.length)
    : 0;

  const vaultsWithIssues = vaultHealthData.filter(({ health }) => health.status === 'poor' || health.status === 'critical').length;

  // Generate alerts
  const alerts = useMemo<Alert[]>(() => {
    const alertList: Alert[] = [];

    // Critical: Agents with critical balance
    const criticalAgents = vaultHealthData.filter(({ agentBalance }) => agentBalance < 0.005);
    if (criticalAgents.length > 0) {
      alertList.push({
        id: 'critical-agent-balance',
        type: 'critical',
        message: `${criticalAgents.length} agent${criticalAgents.length > 1 ? 's' : ''} critically low on gas - transactions may fail`,
        action: {
          label: 'Fund Agents',
          onClick: () => console.log('Fund agents'),
        },
      });
    }

    // Warning: Agents with low balance
    const lowAgents = vaultHealthData.filter(({ agentBalance }) => agentBalance >= 0.005 && agentBalance < 0.01);
    if (lowAgents.length > 0) {
      alertList.push({
        id: 'low-agent-balance',
        type: 'warning',
        message: `${lowAgents.length} agent${lowAgents.length > 1 ? 's' : ''} running low on gas`,
        action: {
          label: 'Top Up',
          onClick: () => console.log('Top up agents'),
        },
      });
    }

    // Warning: Paused vaults
    if (pausedVaults > 0) {
      alertList.push({
        id: 'paused-vaults',
        type: 'warning',
        message: `${pausedVaults} vault${pausedVaults > 1 ? 's are' : ' is'} paused`,
        action: {
          label: 'Review',
          onClick: () => console.log('Review paused vaults'),
        },
      });
    }

    // Warning: Vaults near daily limit
    const vaultsNearLimit = vaults.filter(v => {
      const limit = Number(v.dailyLimit);
      const spent = Number(v.dailySpent);
      return limit > 0 && (spent / limit) > 0.8;
    });
    if (vaultsNearLimit.length > 0) {
      alertList.push({
        id: 'near-limit',
        type: 'warning',
        message: `${vaultsNearLimit.length} vault${vaultsNearLimit.length > 1 ? 's' : ''} near daily limit`,
      });
    }

    // Info: Low success rate
    if (transactions.length >= 10 && Number(successRate) < 70) {
      alertList.push({
        id: 'low-success-rate',
        type: 'info',
        message: `Success rate at ${successRate}% - consider reviewing policies`,
      });
    }

    return alertList.filter(alert => !dismissedAlerts.has(alert.id));
  }, [vaultHealthData, pausedVaults, vaults, transactions.length, successRate, dismissedAlerts]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return <AlertCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Header with Inline Alerts */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-display font-black text-caldera-black">Command Center</h1>
            <span className="flex items-center gap-1.5 text-xs text-caldera-success">
              <span className="w-1.5 h-1.5 rounded-full bg-caldera-success animate-pulse" />
              System Online • Devnet
            </span>
          </div>
          {alerts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`text-xs rounded-lg px-3 py-1.5 border flex items-center gap-2 ${getAlertColor(alert.type)}`}
                >
                  <span className="font-medium">{alert.message}</span>
                  <button onClick={() => dismissAlert(alert.id)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/vaults">
            <button className="px-3 py-1.5 rounded-lg bg-caldera-orange hover:bg-caldera-orange-secondary text-white text-sm font-medium transition-colors flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Create Vault
            </button>
          </Link>
        </div>
      </div>

      {/* Compact Stats Grid - 6 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-caldera-orange/10 flex items-center justify-center">
              <Vault className="w-4 h-4 text-caldera-orange" />
            </div>
            <span className="text-xs text-caldera-text-muted">Vaults</span>
          </div>
          <div className="text-xl font-display font-black text-caldera-black">{totalVaults}</div>
          <div className="text-xs text-caldera-text-muted mt-0.5">{activeVaults} active</div>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-caldera-success/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-caldera-success" />
            </div>
            <span className="text-xs text-caldera-text-muted">Daily Limit</span>
          </div>
          <div className="text-xl font-display font-black text-caldera-black">{formatSol(totalBalance.toString())}</div>
          <div className="text-xs text-caldera-text-muted mt-0.5">SOL</div>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-caldera-purple/10 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-caldera-purple" />
            </div>
            <span className="text-xs text-caldera-text-muted">Transactions</span>
          </div>
          <div className="text-xl font-display font-black text-caldera-black">{transactions.length}</div>
          <div className="text-xs text-caldera-success mt-0.5">+{successfulTransactions}</div>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-caldera-info/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-caldera-info" />
            </div>
            <span className="text-xs text-caldera-text-muted">Success</span>
          </div>
          <div className="text-xl font-display font-black text-caldera-black">{successRate}%</div>
          <div className="text-xs text-caldera-text-muted mt-0.5">{successfulTransactions}/{transactions.length}</div>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-lg ${getHealthScoreBgColor(averageHealth)} flex items-center justify-center`}>
              <Activity className={`w-4 h-4 ${getHealthScoreColor(averageHealth)}`} />
            </div>
            <span className="text-xs text-caldera-text-muted">Health</span>
          </div>
          <div className={`text-xl font-display font-black ${getHealthScoreColor(averageHealth)}`}>{averageHealth}</div>
          <div className="text-xs text-caldera-text-muted mt-0.5">{vaultsWithIssues} issues</div>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-caldera-orange/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-caldera-orange" />
            </div>
            <span className="text-xs text-caldera-text-muted">Agents</span>
          </div>
          <div className="text-xl font-display font-black text-caldera-black">{agentPublicKeys.length}</div>
          <div className="text-xs text-caldera-text-muted mt-0.5">active</div>
        </div>
      </div>

      {/* Main Content: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Agent Health (Compact Table) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-caldera-orange" />
              <h2 className="text-sm font-display font-bold text-caldera-black">Agent Health Monitor</h2>
            </div>
            {agentBalances && Object.values(agentBalances).some(b => b.isLow) && (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            )}
          </div>

          <div className="overflow-x-auto">
            {!agentBalances ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-caldera-orange/20 border-t-caldera-orange" />
              </div>
            ) : vaultHealthData.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-caldera-text-secondary">No agents configured</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-caldera-text-secondary">Vault</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-caldera-text-secondary">Agent</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-caldera-text-secondary">Balance</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-caldera-text-secondary">Est. Txs</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-caldera-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vaultHealthData.slice(0, 8).map(({ vault, agentBalance }) => {
                    const balanceInfo = agentBalances[vault.agentSigner];
                    if (!balanceInfo) return null;

                    return (
                      <tr key={vault.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-caldera-black">
                          {vault.name || formatAddress(vault.publicKey, 4)}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-caldera-text-muted">
                          {formatAddress(vault.agentSigner, 4)}
                        </td>
                        <td className={`px-4 py-2 text-right font-bold ${getAgentBalanceColor(balanceInfo.status)}`}>
                          {agentBalance.toFixed(4)}
                        </td>
                        <td className="px-4 py-2 text-right text-caldera-text-muted">
                          ~{balanceInfo.estimatedTransactions}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            balanceInfo.status === 'healthy' ? 'bg-caldera-success/10 text-caldera-success' :
                            balanceInfo.status === 'low' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {balanceInfo.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-display font-bold text-caldera-black mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 text-caldera-black transition-colors text-sm">
                <Wallet className="w-4 h-4" />
                <span className="font-medium">Fund Agents</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 hover:border-orange-300 text-orange-700 transition-colors text-sm">
                <Pause className="w-4 h-4" />
                <span className="font-medium">Emergency Pause</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 text-caldera-black transition-colors text-sm">
                <Download className="w-4 h-4" />
                <span className="font-medium">Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Compact List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-caldera-purple" />
            <h2 className="text-sm font-display font-bold text-caldera-black">Recent Activity</h2>
          </div>
          <Link href="/transactions" className="text-xs font-medium text-caldera-purple hover:text-caldera-purple/80 flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {transactionsLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-caldera-purple/20 border-t-caldera-purple" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-caldera-text-secondary">No transactions yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-caldera-text-secondary">Vault</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-caldera-text-secondary">To</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-caldera-text-secondary">Amount</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-caldera-text-secondary">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-caldera-text-secondary">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.slice(0, 8).map((tx) => {
                  const vault = vaults.find(v => v.id === tx.vaultId);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-caldera-black">
                        {vault?.name || formatAddress(vault?.publicKey || '', 4)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-caldera-text-muted">
                        {formatAddress(tx.to, 4)}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-caldera-black">
                        {formatSol(tx.amount)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                          tx.status === TransactionStatus.EXECUTED ? 'bg-caldera-success/10 text-caldera-success' :
                          tx.status === TransactionStatus.BLOCKED ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {tx.status === TransactionStatus.EXECUTED ? 'OK' : tx.status === TransactionStatus.BLOCKED ? 'BLOCKED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-caldera-text-muted">
                        {formatRelativeTime(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
