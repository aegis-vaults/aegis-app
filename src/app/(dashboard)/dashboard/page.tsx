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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-black text-caldera-black">
            Command Center
          </h1>
          <p className="text-caldera-text-secondary mt-1">
            Real-time oversight of your AI agents and vaults
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-caldera-text-muted">Today</div>
          <div className="text-lg font-semibold text-caldera-black">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`rounded-2xl p-4 border flex items-center justify-between ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-center gap-3">
                {getAlertIcon(alert.type)}
                <span className="font-medium">{alert.message}</span>
              </div>
              <div className="flex items-center gap-2">
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className="px-3 py-1 rounded-lg bg-white/80 hover:bg-white text-sm font-medium transition-colors"
                  >
                    {alert.action.label}
                  </button>
                )}
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Row: Health + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vault Health Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-caldera-purple" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-caldera-black">Vault Health</h2>
                <p className="text-sm text-caldera-text-muted">Overall system status</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Health Score Gauge */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${(averageHealth / 100) * 351.86} 351.86`}
                    className={getHealthScoreColor(averageHealth)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-3xl font-display font-black ${getHealthScoreColor(averageHealth)}`}>
                    {averageHealth}
                  </div>
                  <div className="text-xs text-caldera-text-muted">Health Score</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="col-span-2 flex flex-col justify-center space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm text-caldera-text-muted">Active Vaults</span>
                <span className="font-bold text-caldera-black">{activeVaults}/{totalVaults}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm text-caldera-text-muted">Vaults with Issues</span>
                <span className={`font-bold ${vaultsWithIssues > 0 ? 'text-orange-600' : 'text-caldera-success'}`}>
                  {vaultsWithIssues}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm text-caldera-text-muted">Avg Success Rate</span>
                <span className="font-bold text-caldera-black">{successRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-display font-bold text-caldera-black mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/vaults">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-caldera-orange hover:bg-caldera-orange-secondary text-white transition-colors">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create New Vault</span>
              </button>
            </Link>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-caldera-black transition-colors">
              <Wallet className="w-5 h-5" />
              <span className="font-medium">Fund All Agents</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-orange-200 hover:border-orange-300 text-orange-700 transition-colors">
              <Pause className="w-5 h-5" />
              <span className="font-medium">Emergency Pause</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-caldera-black transition-colors">
              <Download className="w-5 h-5" />
              <span className="font-medium">Download Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
              <Vault className="w-5 h-5 text-caldera-orange" />
            </div>
            <TrendingUp className="w-4 h-4 text-caldera-success" />
          </div>
          <div className="text-2xl font-display font-black text-caldera-black mb-1">
            {totalVaults}
          </div>
          <p className="text-sm text-caldera-text-muted mb-2">Total Vaults</p>
          <Link href="/vaults" className="text-xs text-caldera-orange hover:text-caldera-orange-secondary font-medium flex items-center gap-1">
            View Details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-caldera-success" />
            </div>
            <TrendingUp className="w-4 h-4 text-caldera-success" />
          </div>
          <div className="text-2xl font-display font-black text-caldera-black mb-1">
            {formatSol(totalBalance.toString())}
          </div>
          <p className="text-sm text-caldera-text-muted mb-2">Total Daily Limit</p>
          <Link href="/vaults" className="text-xs text-caldera-orange hover:text-caldera-orange-secondary font-medium flex items-center gap-1">
            Manage Limits <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-caldera-purple" />
            </div>
            <span className="text-xs font-medium text-caldera-success bg-caldera-success/10 px-2 py-1 rounded-full">
              +{successfulTransactions}
            </span>
          </div>
          <div className="text-2xl font-display font-black text-caldera-black mb-1">
            {transactions.length}
          </div>
          <p className="text-sm text-caldera-text-muted mb-2">Recent Activity</p>
          <Link href="/transactions" className="text-xs text-caldera-orange hover:text-caldera-orange-secondary font-medium flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-info/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-caldera-info" />
            </div>
            {Number(successRate) >= 90 ? (
              <TrendingUp className="w-4 h-4 text-caldera-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-orange-600" />
            )}
          </div>
          <div className="text-2xl font-display font-black text-caldera-black mb-1">
            {successRate}<span className="text-lg text-caldera-text-muted">%</span>
          </div>
          <p className="text-sm text-caldera-text-muted mb-2">Success Rate</p>
          <span className="text-xs text-caldera-text-muted">
            {successfulTransactions}/{transactions.length} executed
          </span>
        </div>
      </div>

      {/* Agent Health Monitor */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-caldera-orange" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-caldera-black">Agent Health Monitor</h2>
              <p className="text-sm text-caldera-text-muted">{agentPublicKeys.length} active agents</p>
            </div>
          </div>
          {agentBalances && Object.values(agentBalances).some(b => b.isLow) && (
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          )}
        </div>

        <div className="p-6">
          {!agentBalances ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-caldera-orange/20 border-t-caldera-orange" />
            </div>
          ) : vaultHealthData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-caldera-text-muted mx-auto mb-3" />
              <p className="text-caldera-text-secondary font-medium">No agents configured</p>
              <p className="text-sm text-caldera-text-muted mt-1">Create a vault to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultHealthData.map(({ vault, agentBalance }) => {
                const balanceInfo = agentBalances[vault.agentSigner];
                if (!balanceInfo) return null;

                return (
                  <div
                    key={vault.id}
                    className={`p-4 rounded-xl border-2 ${getAgentBalanceBgColor(balanceInfo.status)} ${getAgentBalanceBorderColor(balanceInfo.status)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-caldera-black text-sm mb-1">
                          {vault.name || formatAddress(vault.publicKey)}
                        </div>
                        <div className="font-mono text-xs text-caldera-text-muted">
                          {formatAddress(vault.agentSigner, 6)}
                        </div>
                      </div>
                      <Badge className={`${getAgentBalanceColor(balanceInfo.status)} bg-white/60 border-0`}>
                        {balanceInfo.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-caldera-text-muted">Balance</span>
                        <span className={`font-bold ${getAgentBalanceColor(balanceInfo.status)}`}>
                          {agentBalance.toFixed(4)} SOL
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-caldera-text-muted">Est. Txs</span>
                        <span className="font-medium text-caldera-black">
                          ~{balanceInfo.estimatedTransactions}
                        </span>
                      </div>
                    </div>

                    {balanceInfo.isLow && (
                      <button className="w-full mt-3 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-sm font-medium text-caldera-black transition-colors">
                        Fund Agent
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-caldera-purple" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-caldera-black">Recent Activity</h2>
              <p className="text-sm text-caldera-text-muted">Last 10 transactions across all vaults</p>
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
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-caldera-purple/20 border-t-caldera-purple" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <ArrowRightLeft className="w-12 h-12 text-caldera-text-muted mx-auto mb-3" />
              <p className="text-caldera-text-secondary font-medium">No transactions yet</p>
              <p className="text-sm text-caldera-text-muted mt-1">Activity will appear here when agents make transactions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const vault = vaults.find(v => v.id === tx.vaultId);
                const statusColor =
                  tx.status === TransactionStatus.EXECUTED ? 'text-caldera-success bg-caldera-success/10 border-caldera-success/20' :
                  tx.status === TransactionStatus.BLOCKED ? 'text-orange-600 bg-orange-50 border-orange-200' :
                  'text-gray-600 bg-gray-50 border-gray-200';

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.status === TransactionStatus.EXECUTED ? 'bg-caldera-success/10' :
                        tx.status === TransactionStatus.BLOCKED ? 'bg-orange-50' :
                        'bg-gray-100'
                      }`}>
                        <CircleDot className={`w-5 h-5 ${
                          tx.status === TransactionStatus.EXECUTED ? 'text-caldera-success' :
                          tx.status === TransactionStatus.BLOCKED ? 'text-orange-600' :
                          'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-caldera-black">
                            {vault?.name || formatAddress(vault?.publicKey || '')}
                          </span>
                          <ChevronRight className="w-3 h-3 text-caldera-text-muted" />
                          <span className="font-mono text-sm text-caldera-text-secondary">
                            {formatAddress(tx.to)}
                          </span>
                        </div>
                        <div className="text-xs text-caldera-text-muted">
                          {formatRelativeTime(tx.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-caldera-black">
                          {formatSol(tx.amount)} SOL
                        </div>
                      </div>
                      <Badge className={statusColor}>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System Status Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-caldera-success">
              <span className="w-2 h-2 rounded-full bg-caldera-success animate-pulse" />
              System Online
            </span>
            <span className="text-caldera-text-muted">Protocol v1.0.0</span>
            <span className="text-caldera-text-muted">Devnet</span>
            {agentPublicKeys.length > 0 && (
              <span className="text-caldera-text-muted">{agentPublicKeys.length} Agents Active</span>
            )}
          </div>
          <span className="text-caldera-text-muted font-medium">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
