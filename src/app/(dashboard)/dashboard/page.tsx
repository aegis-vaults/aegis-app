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

  // Generate alerts (filtered to only show critical issues)
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
          label: 'Fund Now',
          onClick: () => console.log('Fund agents'),
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

    return alertList.filter(alert => !dismissedAlerts.has(alert.id));
  }, [vaultHealthData, pausedVaults, dismissedAlerts]);

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
          <h1 className="text-2xl font-display font-black text-caldera-black uppercase tracking-tight">Command Center</h1>
          {alerts.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`text-xs rounded-full px-4 py-2 border flex items-center gap-2 font-medium ${getAlertColor(alert.type)}`}
                >
                  {getAlertIcon(alert.type)}
                  <span>{alert.message}</span>
                  {alert.action && (
                    <button
                      onClick={alert.action.onClick}
                      className="ml-1 px-2 py-0.5 bg-white/50 hover:bg-white rounded-full text-xs font-bold transition-colors"
                    >
                      {alert.action.label}
                    </button>
                  )}
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
            <button className="px-4 py-2 rounded-full bg-caldera-orange hover:bg-caldera-orange-secondary text-white text-sm font-bold transition-all shadow-lg shadow-caldera-orange/20 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              New Vault
            </button>
          </Link>
        </div>
      </div>

      {/* Compact Stats Grid - 6 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-8 h-8 rounded-xl bg-caldera-orange/10 flex items-center justify-center mb-2">
            <Vault className="w-4 h-4 text-caldera-orange" />
          </div>
          <div className="text-xs uppercase tracking-wide text-caldera-text-muted font-bold mb-1">Vaults</div>
          <div className="text-2xl font-display font-black text-caldera-black">{totalVaults}</div>
          <div className="text-xs text-caldera-success font-medium mt-1">{activeVaults} active</div>
        </div>

        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-8 h-8 rounded-xl bg-caldera-success/10 flex items-center justify-center mb-2">
            <Coins className="w-4 h-4 text-caldera-success" />
          </div>
          <div className="text-xs uppercase tracking-wide text-caldera-text-muted font-bold mb-1">Daily Limit</div>
          <div className="text-2xl font-display font-black text-caldera-black">{formatSol(totalBalance.toString())}</div>
          <div className="text-xs text-caldera-text-muted font-medium mt-1">SOL</div>
        </div>

        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-8 h-8 rounded-xl bg-caldera-purple/10 flex items-center justify-center mb-2">
            <ArrowRightLeft className="w-4 h-4 text-caldera-purple" />
          </div>
          <div className="text-xs uppercase tracking-wide text-caldera-text-muted font-bold mb-1">Transactions</div>
          <div className="text-2xl font-display font-black text-caldera-black">{transactions.length}</div>
          <div className="text-xs text-caldera-success font-medium mt-1">+{successfulTransactions} executed</div>
        </div>

        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-8 h-8 rounded-xl bg-caldera-info/10 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-caldera-info" />
          </div>
          <div className="text-xs uppercase tracking-wide text-caldera-text-muted font-bold mb-1">Success Rate</div>
          <div className="text-2xl font-display font-black text-caldera-black">{successRate}%</div>
          <div className="text-xs text-caldera-text-muted font-medium mt-1">{successfulTransactions}/{transactions.length}</div>
        </div>

        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className={`w-8 h-8 rounded-xl ${getHealthScoreBgColor(averageHealth)} flex items-center justify-center mb-2`}>
            <Activity className={`w-4 h-4 ${getHealthScoreColor(averageHealth)}`} />
          </div>
          <div className="text-xs uppercase tracking-wide text-caldera-text-muted font-bold mb-1">Health Score</div>
          <div className={`text-2xl font-display font-black ${getHealthScoreColor(averageHealth)}`}>{averageHealth}</div>
          <div className="text-xs text-caldera-text-muted font-medium mt-1">{vaultsWithIssues} issues</div>
        </div>

        <div className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-8 h-8 rounded-xl bg-caldera-orange/10 flex items-center justify-center mb-2">
            <Zap className="w-4 h-4 text-caldera-orange" />
          </div>
          <div className="text-xs uppercase tracking-wide text-caldera-text-muted font-bold mb-1">Agents</div>
          <div className="text-2xl font-display font-black text-caldera-black">{agentPublicKeys.length}</div>
          <div className="text-xs text-caldera-text-muted font-medium mt-1">active</div>
        </div>
      </div>

      {/* Main Content: 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Agent Health (Compact Table) */}
        <div className="lg:col-span-2 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-caldera-orange" />
              </div>
              <h2 className="text-sm font-display font-black text-caldera-black uppercase tracking-wide">Agent Health Monitor</h2>
            </div>
            {agentBalances && Object.values(agentBalances).some(b => b.isLow) && (
              <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
                {Object.values(agentBalances).filter(b => b.isLow).length} LOW
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            {vaults.length === 0 && !vaultsLoading ? (
              <div className="text-center py-6">
                <p className="text-sm text-caldera-text-secondary">No agents configured</p>
              </div>
            ) : !agentBalances ? (
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
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-display font-black text-caldera-black uppercase tracking-wide mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-gray-200 hover:border-caldera-black text-caldera-black transition-all text-sm font-bold">
                <Wallet className="w-4 h-4" />
                <span>Fund Agents</span>
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-orange-200 hover:border-orange-400 text-orange-700 transition-all text-sm font-bold">
                <Pause className="w-4 h-4" />
                <span>Emergency Pause</span>
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-gray-200 hover:border-caldera-black text-caldera-black transition-all text-sm font-bold">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Compact List */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-caldera-purple" />
            </div>
            <h2 className="text-sm font-display font-black text-caldera-black uppercase tracking-wide">Recent Activity</h2>
          </div>
          <Link href="/transactions" className="text-xs font-bold text-caldera-purple hover:text-caldera-purple/80 flex items-center gap-1">
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
