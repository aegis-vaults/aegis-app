'use client';

import { useParams } from 'next/navigation';
import { useVault } from '@/lib/hooks/use-vaults';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useAgentBalance, getAgentBalanceColor, getAgentBalanceBgColor, getAgentBalanceBorderColor } from '@/lib/hooks/use-agent-balance';
import { calculateVaultHealth, getHealthScoreColor, getHealthScoreBgColor, getHealthStatusColor } from '@/lib/utils/vault-health';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { VaultCredentials } from '@/components/vault/vault-credentials';
import { VaultSettingsDialog } from '@/components/vault/vault-settings-dialog';
import { formatSol, formatAddress, formatRelativeTime, lamportsToSol, solToLamports, isValidSolanaAddress, calculatePercentage, cn } from '@/lib/utils';
import { ArrowLeft, Wallet, TrendingUp, History, Settings, Pause, Play, Loader2, RefreshCw, Shield,
  DollarSign, AlertTriangle, CheckCircle, XCircle, Clock, Activity, BarChart3, PieChart,
  Download, Users, Zap, Fuel, TrendingDown, Calendar, Target, AlertCircle, Info, Plus, X, Send } from 'lucide-react';
import Link from 'next/link';
import { LAMPORTS_PER_SOL } from '@/lib/constants';
import { useState, useEffect, useMemo } from 'react';
import { getConnection } from '@/lib/solana/config';
import { PublicKey, Connection } from '@solana/web3.js';
import { getVaultAuthorityPDA } from '@/lib/solana/program';
import { useWallet } from '@solana/wallet-adapter-react';
import { instructions } from '@/lib/solana/instructions';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Transaction, TransactionStatus, BlockReason } from '@/types/api';

export default function VaultDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const wallet = useWallet();

  const { data: vaultData, isLoading, refetch } = useVault(id);
  const vault = vaultData?.data;

  // Fetch transactions for analytics
  const { data: transactionsData } = useTransactions({ vaultId: id, pageSize: 1000 });
  const transactions = transactionsData?.data?.items || [];

  // Fetch agent balance
  const { data: agentBalanceData, refetch: refetchAgentBalance } = useAgentBalance(vault?.agentSigner);
  const agentBalance = agentBalanceData;

  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fundAgentAmount, setFundAgentAmount] = useState('0.01');
  const [fundingAgent, setFundingAgent] = useState(false);
  const [newWhitelistAddress, setNewWhitelistAddress] = useState('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [activityFilter, setActivityFilter] = useState<'all' | 'executed' | 'blocked' | 'policy'>('all');

  useEffect(() => {
    async function fetchBalance() {
      if (!vault) return;

      setLoadingBalance(true);
      try {
        const connection: Connection = getConnection();
        const vaultPubkey = new PublicKey(vault.publicKey);
        const [vaultAuthority] = getVaultAuthorityPDA(vaultPubkey);
        const bal = await connection.getBalance(vaultAuthority);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoadingBalance(false);
      }
    }

    fetchBalance();
  }, [vault]);

  const handleTogglePause = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !vault) {
      toast.error('Please connect your wallet');
      return;
    }

    const isPaused = !vault.isActive;
    const action = isPaused ? 'resume' : 'pause';

    setTogglingPause(true);
    try {
      const connection: Connection = getConnection();
      const vaultPubkey = new PublicKey(vault.publicKey);
      const vaultNonce = BigInt(vault.vaultNonce || '0');

      const { transaction } = isPaused
        ? await instructions.resumeVault(wallet as any, vaultPubkey, vaultNonce)
        : await instructions.pauseVault(wallet as any, vaultPubkey, vaultNonce);

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      await api.vaults.update(vault.id, {
        paused: !isPaused,
      });

      toast.success(`Vault ${action}d successfully`);
      refetch();
    } catch (error: any) {
      console.error(`Error ${action}ing vault:`, error);
      toast.error(error.message || `Failed to ${action} vault`);
    } finally {
      setTogglingPause(false);
    }
  };

  const handleFundAgent = async () => {
    if (!wallet.publicKey || !wallet.sendTransaction || !vault?.agentSigner) {
      toast.error('Please connect your wallet');
      return;
    }

    const amount = parseFloat(fundAgentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setFundingAgent(true);
    try {
      const connection = getConnection();
      const transaction = new (await import('@solana/web3.js')).Transaction();

      transaction.add(
        (await import('@solana/web3.js')).SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(vault.agentSigner),
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success(`Successfully funded agent with ${amount} SOL`);
      refetchAgentBalance();
      setFundAgentAmount('0.01');
    } catch (error: any) {
      console.error('Error funding agent:', error);
      toast.error(error.message || 'Failed to fund agent');
    } finally {
      setFundingAgent(false);
    }
  };

  // Calculate analytics from transactions
  const analytics = useMemo(() => {
    if (!transactions.length || !vault) {
      return {
        totalSpent: 0,
        executedCount: 0,
        blockedCount: 0,
        successRate: 0,
        dailySpending: [] as { date: string; amount: number; count: number }[],
        hourlyBreakdown: [] as { hour: number; amount: number; count: number }[],
        topDestinations: [] as { address: string; amount: number; count: number }[],
        blockReasons: [] as { reason: string; count: number }[],
        successRateTrend: [] as { date: string; rate: number }[],
        gasUsageHistory: [] as { signature: string; timestamp: string; fee: number }[],
        activityTimeline: [] as any[],
      };
    }

    const now = Date.now();
    const cutoffTime = {
      '24h': now - 24 * 60 * 60 * 1000,
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000,
      'all': 0,
    }[timeRange];

    const filteredTxs = transactions.filter((tx: Transaction) =>
      new Date(tx.createdAt).getTime() >= cutoffTime
    );

    const executedTxs = filteredTxs.filter((tx: Transaction) => tx.status === TransactionStatus.EXECUTED);
    const blockedTxs = filteredTxs.filter((tx: Transaction) => tx.status === TransactionStatus.BLOCKED);

    const totalSpent = executedTxs.reduce((sum, tx) => sum + Number(tx.amount), 0) / LAMPORTS_PER_SOL;
    const successRate = filteredTxs.length > 0 ? (executedTxs.length / filteredTxs.length) * 100 : 0;

    // Daily spending
    const dailyMap = new Map<string, { amount: number; count: number }>();
    executedTxs.forEach((tx: Transaction) => {
      const date = new Date(tx.createdAt).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { amount: 0, count: 0 };
      dailyMap.set(date, {
        amount: existing.amount + Number(tx.amount) / LAMPORTS_PER_SOL,
        count: existing.count + 1,
      });
    });
    const dailySpending = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Hourly breakdown
    const hourlyMap = new Map<number, { amount: number; count: number }>();
    executedTxs.forEach((tx: Transaction) => {
      const hour = new Date(tx.createdAt).getHours();
      const existing = hourlyMap.get(hour) || { amount: 0, count: 0 };
      hourlyMap.set(hour, {
        amount: existing.amount + Number(tx.amount) / LAMPORTS_PER_SOL,
        count: existing.count + 1,
      });
    });
    const hourlyBreakdown = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour - b.hour);

    // Top destinations
    const destMap = new Map<string, { amount: number; count: number }>();
    executedTxs.forEach((tx: Transaction) => {
      const existing = destMap.get(tx.to) || { amount: 0, count: 0 };
      destMap.set(tx.to, {
        amount: existing.amount + Number(tx.amount) / LAMPORTS_PER_SOL,
        count: existing.count + 1,
      });
    });
    const topDestinations = Array.from(destMap.entries())
      .map(([address, data]) => ({ address, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Block reasons
    const reasonMap = new Map<string, number>();
    blockedTxs.forEach((tx: Transaction) => {
      if (tx.blockReason) {
        reasonMap.set(tx.blockReason, (reasonMap.get(tx.blockReason) || 0) + 1);
      }
    });
    const blockReasons = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // Success rate trend (daily)
    const dailyTxMap = new Map<string, { total: number; executed: number }>();
    filteredTxs.forEach((tx: Transaction) => {
      const date = new Date(tx.createdAt).toISOString().split('T')[0];
      const existing = dailyTxMap.get(date) || { total: 0, executed: 0 };
      dailyTxMap.set(date, {
        total: existing.total + 1,
        executed: existing.executed + (tx.status === TransactionStatus.EXECUTED ? 1 : 0),
      });
    });
    const successRateTrend = Array.from(dailyTxMap.entries())
      .map(([date, data]) => ({ date, rate: (data.executed / data.total) * 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Gas usage (estimate 5000 lamports per tx)
    const gasUsageHistory = executedTxs
      .slice(0, 10)
      .map((tx: Transaction) => ({
        signature: tx.signature,
        timestamp: tx.createdAt,
        fee: 0.000005, // Estimated 5000 lamports
      }));

    // Activity timeline
    const activityTimeline = [
      ...filteredTxs.map((tx: Transaction) => ({
        type: tx.status === TransactionStatus.EXECUTED ? 'executed' : 'blocked',
        timestamp: tx.createdAt,
        title: tx.status === TransactionStatus.EXECUTED ? 'Transaction Executed' : 'Transaction Blocked',
        description: `${lamportsToSol(tx.amount).toFixed(4)} SOL to ${formatAddress(tx.to)}`,
        reason: tx.blockReason,
        icon: tx.status === TransactionStatus.EXECUTED ? CheckCircle : XCircle,
        color: tx.status === TransactionStatus.EXECUTED ? 'text-caldera-success' : 'text-red-600',
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      totalSpent,
      executedCount: executedTxs.length,
      blockedCount: blockedTxs.length,
      successRate,
      dailySpending,
      hourlyBreakdown,
      topDestinations,
      blockReasons,
      successRateTrend,
      gasUsageHistory,
      activityTimeline,
    };
  }, [transactions, timeRange, vault]);

  // Calculate vault health
  const vaultHealth = useMemo(() => {
    if (!vault || !agentBalance) return null;

    const lastActivity = transactions.length > 0
      ? new Date(transactions[0].createdAt).getTime()
      : undefined;

    return calculateVaultHealth({
      vaultBalance: balance,
      agentBalance: agentBalance.balance,
      dailyLimit: Number(vault.dailyLimit),
      dailySpent: Number(vault.dailySpent),
      isPaused: !vault.isActive,
      lastActivityTimestamp: lastActivity,
      totalTransactions: transactions.length,
      successfulTransactions: analytics.executedCount,
      blockedTransactions: analytics.blockedCount,
      hasWhitelist: vault.whitelistEnabled,
      whitelistCount: vault.whitelist?.length || 0,
      hasAgentSigner: !!vault.agentSigner,
    });
  }, [vault, agentBalance, balance, transactions, analytics]);

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-caldera-text-muted" />
        </div>
        <h2 className="text-xl font-display font-bold text-caldera-black mb-2">Invalid Vault ID</h2>
        <Link href="/vaults">
          <Button variant="outline" className="rounded-xl mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vaults
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-caldera-orange/20 border-t-caldera-orange" />
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-caldera-text-muted" />
        </div>
        <h2 className="text-xl font-display font-bold text-caldera-black mb-2">Vault Not Found</h2>
        <Link href="/vaults">
          <Button variant="outline" className="rounded-xl mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vaults
          </Button>
        </Link>
      </div>
    );
  }

  const spentPercentage = (Number(vault.dailySpent) / Number(vault.dailyLimit)) * 100;

  // Filter activity timeline
  const filteredActivity = analytics.activityTimeline.filter(item => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'executed') return item.type === 'executed';
    if (activityFilter === 'blocked') return item.type === 'blocked';
    return false;
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Quick Actions Bar */}
        <div className="bg-gradient-to-r from-caldera-orange/5 to-caldera-purple/5 border border-caldera-orange/20 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              className="rounded-xl bg-caldera-success hover:bg-caldera-success/90"
              onClick={() => {
                // Fund vault action
                toast.info('Fund Vault feature coming soon');
              }}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Fund Vault
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-caldera-orange text-caldera-orange hover:bg-caldera-orange/10"
              onClick={() => setFundAgentAmount('0.01')}
            >
              <Fuel className="w-4 h-4 mr-2" />
              Fund Agent
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={handleTogglePause}
              disabled={togglingPause}
            >
              {!vault.isActive ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                toast.info('Export feature coming soon');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/vaults">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-black text-caldera-black">
                {vault.name || 'Unnamed Vault'}
              </h1>
              <p className="text-caldera-text-secondary text-sm mt-1">
                Created {new Date(vault.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-12 sm:pl-0">
            <Badge
              className={vault.isActive
                ? 'bg-caldera-success/10 text-caldera-success border-caldera-success/20'
                : 'bg-gray-100 text-caldera-text-muted border-gray-200'
              }
            >
              {vault.isActive ? 'Active' : 'Paused'}
            </Badge>
            <Badge variant="outline" className="border-gray-200">
              {vault.tier || 'PERSONAL'}
            </Badge>
            {vaultHealth && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge className={getHealthStatusColor(vaultHealth.status)}>
                    {vaultHealth.score}/100 Health
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold mb-1">Vault Health: {vaultHealth.status.toUpperCase()}</p>
                  {vaultHealth.issues.length > 0 && (
                    <div className="text-xs">
                      {vaultHealth.issues.map((issue, i) => (
                        <p key={i} className="text-red-600">• {issue}</p>
                      ))}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-gray-200 hover:bg-gray-100"
              onClick={() => {
                refetch();
                refetchAgentBalance();
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-caldera-success" />
              </div>
              <span className="text-caldera-text-secondary text-sm">Vault Balance</span>
            </div>
            <div className="text-2xl font-display font-black text-caldera-success">
              {loadingBalance ? 'Loading...' : `${balance.toFixed(4)} SOL`}
            </div>
          </div>

          {agentBalance && (
            <div className={cn(
              "bg-white rounded-2xl p-6 shadow-sm border",
              getAgentBalanceBorderColor(agentBalance.status)
            )}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", getAgentBalanceBgColor(agentBalance.status))}>
                  <Fuel className={cn("w-5 h-5", getAgentBalanceColor(agentBalance.status))} />
                </div>
                <div>
                  <span className="text-caldera-text-secondary text-sm">Agent Balance</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-caldera-text-muted inline ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gas balance for AI agent transactions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className={cn("text-2xl font-display font-black", getAgentBalanceColor(agentBalance.status))}>
                {agentBalance.balance.toFixed(4)} SOL
              </div>
              <div className="text-xs text-caldera-text-muted mt-2">
                ~{agentBalance.estimatedTransactions} txs remaining
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-caldera-orange" />
              </div>
              <span className="text-caldera-text-secondary text-sm">Daily Limit</span>
            </div>
            <div className="text-2xl font-display font-black text-caldera-black">
              {formatSol(vault.dailyLimit)} SOL
            </div>
            <div className="text-xs text-caldera-text-muted mt-2">
              {formatSol(vault.dailySpent)} spent today ({spentPercentage.toFixed(1)}%)
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-caldera-orange to-caldera-purple rounded-full transition-all"
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-caldera-purple" />
              </div>
              <span className="text-caldera-text-secondary text-sm">Success Rate</span>
            </div>
            <div className="text-2xl font-display font-black text-caldera-black">
              {analytics.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-caldera-text-muted mt-2">
              {analytics.executedCount} executed, {analytics.blockedCount} blocked
            </div>
          </div>
        </div>

        {/* Health & Security Insights */}
        {vaultHealth && (vaultHealth.issues.length > 0 || vaultHealth.warnings.length > 0) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", getHealthScoreBgColor(vaultHealth.score))}>
                <Shield className={cn("w-5 h-5", getHealthScoreColor(vaultHealth.score))} />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-caldera-black">Vault Health & Security</h3>
                <p className="text-sm text-caldera-text-muted">Score: {vaultHealth.score}/100 - {vaultHealth.status.toUpperCase()}</p>
              </div>
            </div>

            {vaultHealth.issues.length > 0 && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <p className="font-semibold text-red-900 mb-2">Critical Issues:</p>
                  <ul className="space-y-1 text-sm text-red-800">
                    {vaultHealth.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {vaultHealth.warnings.length > 0 && (
              <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <p className="font-semibold text-yellow-900 mb-2">Warnings:</p>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {vaultHealth.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {vaultHealth.recommendations.length > 0 && (
              <div>
                <p className="font-semibold text-caldera-black mb-2">Recommendations:</p>
                <ul className="space-y-1 text-sm text-caldera-text-secondary">
                  {vaultHealth.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-caldera-orange mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="agent" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 rounded-xl p-1 h-12">
            <TabsTrigger value="agent" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Fuel className="w-4 h-4 mr-2" />
              Agent
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="integration" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4 mr-2" />
              Integration
            </TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <History className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4 mr-2" />
              Policy
            </TabsTrigger>
          </TabsList>

          {/* Agent Tab */}
          <TabsContent value="agent" className="space-y-4 mt-6">
            {/* Agent Balance Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-display font-bold text-caldera-black">Agent Wallet</h3>
                <p className="text-sm text-caldera-text-muted">Monitor and fund your AI agent's gas wallet</p>
              </div>
              <div className="p-6 space-y-6">
                {agentBalance ? (
                  <>
                    {/* Balance Status */}
                    <div className={cn("p-6 rounded-xl border-2", getAgentBalanceBorderColor(agentBalance.status), getAgentBalanceBgColor(agentBalance.status))}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-caldera-text-secondary mb-1">Current Balance</p>
                          <p className={cn("text-3xl font-display font-black", getAgentBalanceColor(agentBalance.status))}>
                            {agentBalance.balance.toFixed(6)} SOL
                          </p>
                        </div>
                        <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center", getAgentBalanceBgColor(agentBalance.status))}>
                          <Fuel className={cn("w-8 h-8", getAgentBalanceColor(agentBalance.status))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-current/10">
                        <div>
                          <p className="text-xs text-caldera-text-muted mb-1">Estimated Runway</p>
                          <p className="font-semibold">~{agentBalance.estimatedTransactions} transactions</p>
                        </div>
                        <div>
                          <p className="text-xs text-caldera-text-muted mb-1">Status</p>
                          <Badge className={getHealthStatusColor(agentBalance.status === 'healthy' ? 'excellent' : agentBalance.status === 'low' ? 'fair' : 'critical')}>
                            {agentBalance.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Fund Agent */}
                    <div className="border-2 border-caldera-orange/20 rounded-xl p-6 bg-caldera-orange/5">
                      <h4 className="font-display font-bold text-caldera-black mb-4">Fund Agent Wallet</h4>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="Amount in SOL"
                            value={fundAgentAmount}
                            onChange={(e) => setFundAgentAmount(e.target.value)}
                            className="rounded-xl"
                          />
                          <div className="flex gap-2 mt-2">
                            {['0.01', '0.05', '0.1', '0.5'].map((amount) => (
                              <Button
                                key={amount}
                                variant="outline"
                                size="sm"
                                onClick={() => setFundAgentAmount(amount)}
                                className="rounded-lg text-xs"
                              >
                                {amount} SOL
                              </Button>
                            ))}
                          </div>
                        </div>
                        <Button
                          onClick={handleFundAgent}
                          disabled={fundingAgent || !parseFloat(fundAgentAmount)}
                          className="rounded-xl bg-caldera-orange hover:bg-caldera-orange/90 h-11"
                        >
                          {fundingAgent ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Fund Agent
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Gas Usage History */}
                    {analytics.gasUsageHistory.length > 0 && (
                      <div>
                        <h4 className="font-display font-bold text-caldera-black mb-4">Recent Gas Usage</h4>
                        <div className="space-y-2">
                          {analytics.gasUsageHistory.map((usage, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-caldera-purple/10 flex items-center justify-center">
                                  <Zap className="w-4 h-4 text-caldera-purple" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-caldera-black">{formatAddress(usage.signature, 8)}</p>
                                  <p className="text-xs text-caldera-text-muted">{formatRelativeTime(usage.timestamp)}</p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-caldera-black">{usage.fee.toFixed(6)} SOL</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Fuel className="w-8 h-8 text-caldera-text-muted" />
                    </div>
                    <p className="text-caldera-text-secondary font-medium">No agent configured</p>
                    <p className="text-xs text-caldera-text-muted mt-1">
                      Set up an agent signer to monitor gas usage
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration" className="space-y-4 mt-6">
          <VaultCredentials
            vaultAddress={vault.publicKey}
            agentSigner={vault.agentSigner || 'Not set'}
            vaultName={vault.name || undefined}
            vaultNonce={vault.vaultNonce || '0'}
          />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-display font-bold text-caldera-black">Transaction History</h3>
              <p className="text-sm text-caldera-text-muted">All transactions executed through this vault</p>
            </div>
            <div className="p-6">
              {vault.transactions && vault.transactions.length > 0 ? (
                <div className="space-y-3">
                  {vault.transactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-caldera-black">
                          {formatAddress(tx.to)}
                        </div>
                        <div className="text-xs text-caldera-text-muted mt-1">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-caldera-black">
                          {(Number(tx.amount) / LAMPORTS_PER_SOL).toFixed(4)} SOL
                        </div>
                        <Badge 
                          className={tx.status === 'EXECUTED' 
                            ? 'bg-caldera-success/10 text-caldera-success border-caldera-success/20' 
                            : 'bg-gray-100 text-caldera-text-muted border-gray-200'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-caldera-text-muted" />
                  </div>
                  <p className="text-caldera-text-secondary font-medium">No transactions yet</p>
                  <p className="text-xs text-caldera-text-muted mt-1">
                    Transactions will appear here once your agent starts using the vault
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 mt-6">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm text-caldera-text-secondary">Time Range:</span>
              {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className="rounded-lg"
                >
                  {range === '24h' ? '24h' : range === '7d' ? '7d' : range === '30d' ? '30d' : 'All'}
                </Button>
              ))}
            </div>

            {/* Spending Chart */}
            {analytics.dailySpending.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-display font-bold text-caldera-black">Daily Spending</h3>
                  <p className="text-sm text-caldera-text-muted">Transaction volume over time</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {analytics.dailySpending.map((day, idx) => {
                      const maxAmount = Math.max(...analytics.dailySpending.map(d => d.amount));
                      const percentage = (day.amount / maxAmount) * 100;
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-caldera-black">{new Date(day.date).toLocaleDateString()}</span>
                            <span className="text-sm font-semibold text-caldera-orange">{day.amount.toFixed(4)} SOL</span>
                          </div>
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                            <div
                              className="h-full bg-gradient-to-r from-caldera-orange to-caldera-purple rounded-lg transition-all flex items-center px-3"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            >
                              <span className="text-xs text-white font-medium">{day.count} txs</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hourly Breakdown */}
              {analytics.hourlyBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-display font-bold text-caldera-black">Hourly Activity</h3>
                    <p className="text-sm text-caldera-text-muted">Agent behavior by hour</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 24 }).map((_, hour) => {
                        const data = analytics.hourlyBreakdown.find(h => h.hour === hour);
                        const maxCount = Math.max(...analytics.hourlyBreakdown.map(h => h.count), 1);
                        const intensity = data ? (data.count / maxCount) * 100 : 0;
                        return (
                          <Tooltip key={hour}>
                            <TooltipTrigger>
                              <div
                                className="aspect-square rounded-lg transition-all cursor-pointer"
                                style={{
                                  backgroundColor: data
                                    ? `rgba(252, 80, 0, ${intensity / 100})`
                                    : '#f3f4f6',
                                }}
                              >
                                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-caldera-black">
                                  {hour}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-semibold">{hour}:00</p>
                              <p className="text-xs">{data ? `${data.count} txs, ${data.amount.toFixed(4)} SOL` : 'No activity'}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Success Rate Trend */}
              {analytics.successRateTrend.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-display font-bold text-caldera-black">Success Rate Trend</h3>
                    <p className="text-sm text-caldera-text-muted">Daily transaction success</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-2">
                      {analytics.successRateTrend.slice(-7).map((trend, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-caldera-black w-24">{new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-lg transition-all",
                                trend.rate >= 90 ? "bg-caldera-success" :
                                  trend.rate >= 70 ? "bg-green-500" :
                                    trend.rate >= 50 ? "bg-yellow-500" : "bg-red-500"
                              )}
                              style={{ width: `${trend.rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-caldera-black w-12 text-right">{trend.rate.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Destinations */}
            {analytics.topDestinations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-display font-bold text-caldera-black">Top Destinations</h3>
                  <p className="text-sm text-caldera-text-muted">Most frequent transaction recipients</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {analytics.topDestinations.map((dest, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
                            <span className="font-bold text-caldera-purple">#{idx + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-caldera-black">{formatAddress(dest.address)}</p>
                            <p className="text-xs text-caldera-text-muted">{dest.count} transactions</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-caldera-orange">{dest.amount.toFixed(4)} SOL</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Block Reason Analysis */}
            {analytics.blockReasons.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-display font-bold text-caldera-black">Block Reason Analysis</h3>
                  <p className="text-sm text-caldera-text-muted">Why transactions were blocked</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {analytics.blockReasons.map((reason, idx) => {
                      const total = analytics.blockReasons.reduce((sum, r) => sum + r.count, 0);
                      const percentage = (reason.count / total) * 100;
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-caldera-black">{reason.reason.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-semibold text-red-600">{reason.count} blocks</span>
                          </div>
                          <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-lg transition-all flex items-center px-3"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-xs text-white font-medium">{percentage.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {analytics.dailySpending.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-caldera-text-muted" />
                    </div>
                    <p className="text-caldera-text-secondary font-medium">No analytics data yet</p>
                    <p className="text-xs text-caldera-text-muted mt-1">
                      Analytics will appear once transactions are processed
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Activity Timeline Tab */}
          <TabsContent value="activity" className="space-y-4 mt-6">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-caldera-text-secondary">Filter:</span>
              {(['all', 'executed', 'blocked'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={activityFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivityFilter(filter)}
                  className="rounded-lg capitalize"
                >
                  {filter}
                </Button>
              ))}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-display font-bold text-caldera-black">Activity Timeline</h3>
                <p className="text-sm text-caldera-text-muted">Complete history of vault events and transactions</p>
              </div>
              <div className="p-6">
                {filteredActivity.length > 0 ? (
                  <div className="space-y-4">
                    {filteredActivity.slice(0, 50).map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                              item.type === 'executed' ? 'bg-caldera-success/10' : 'bg-red-50'
                            )}>
                              <Icon className={cn("w-5 h-5", item.color)} />
                            </div>
                            {idx < filteredActivity.length - 1 && (
                              <div className="w-0.5 flex-1 bg-gray-200 my-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-caldera-black">{item.title}</h4>
                              <span className="text-xs text-caldera-text-muted">{formatRelativeTime(item.timestamp)}</span>
                            </div>
                            <p className="text-sm text-caldera-text-secondary">{item.description}</p>
                            {item.reason && (
                              <Badge className="mt-2 bg-red-50 text-red-700 border-red-200">
                                {item.reason.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-caldera-text-muted" />
                    </div>
                    <p className="text-caldera-text-secondary font-medium">No activity yet</p>
                    <p className="text-xs text-caldera-text-muted mt-1">
                      Activity will appear here as your vault processes transactions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab (Enhanced Policy Management) */}
          <TabsContent value="settings" className="space-y-4 mt-6">
            {/* Visual Whitelist Manager */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-display font-bold text-caldera-black">Whitelist Manager</h3>
                    <p className="text-sm text-caldera-text-muted">Manage approved transaction recipients (max 20)</p>
                  </div>
                  <Badge variant="outline" className="border-gray-200">
                    {vault.whitelist?.length || 0} / 20
                  </Badge>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Add Address */}
                <div className="border-2 border-caldera-orange/20 rounded-xl p-4 bg-caldera-orange/5">
                  <h4 className="font-semibold text-caldera-black mb-3">Add New Address</h4>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter Solana address"
                      value={newWhitelistAddress}
                      onChange={(e) => setNewWhitelistAddress(e.target.value)}
                      className="rounded-xl flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (isValidSolanaAddress(newWhitelistAddress)) {
                          toast.success('Address validated - use Settings dialog to save');
                          setSettingsOpen(true);
                        } else {
                          toast.error('Invalid Solana address');
                        }
                      }}
                      disabled={!newWhitelistAddress || (vault.whitelist?.length || 0) >= 20}
                      className="rounded-xl bg-caldera-orange hover:bg-caldera-orange/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  {newWhitelistAddress && !isValidSolanaAddress(newWhitelistAddress) && (
                    <p className="text-xs text-red-600 mt-2">Invalid address format</p>
                  )}
                </div>

                {/* Current Whitelist */}
                {vault.whitelist && vault.whitelist.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-caldera-black mb-2">Whitelisted Addresses</h4>
                    {vault.whitelist.map((address, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-caldera-success/10 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-caldera-success" />
                          </div>
                          <div>
                            <p className="font-medium text-caldera-black">{formatAddress(address)}</p>
                            <p className="text-xs text-caldera-text-muted">Added {new Date(vault.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast.info('Use Settings dialog to remove addresses');
                            setSettingsOpen(true);
                          }}
                          className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <Users className="w-12 h-12 text-caldera-text-muted mx-auto mb-2" />
                    <p className="text-sm text-caldera-text-secondary">No addresses whitelisted</p>
                    <p className="text-xs text-caldera-text-muted mt-1">Add addresses above to create whitelist</p>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Limit Configuration */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-display font-bold text-caldera-black">Daily Limit Configuration</h3>
                <p className="text-sm text-caldera-text-muted">Set spending limits to control agent behavior</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-caldera-text-muted mb-1">Current Limit</p>
                    <p className="text-2xl font-display font-bold text-caldera-black">{formatSol(vault.dailyLimit)} SOL</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-caldera-text-muted mb-1">Spent Today</p>
                    <p className="text-2xl font-display font-bold text-caldera-orange">{formatSol(vault.dailySpent)} SOL</p>
                  </div>
                </div>

                <Alert className="border-caldera-purple/20 bg-caldera-purple/5">
                  <Info className="h-4 w-4 text-caldera-purple" />
                  <AlertDescription className="text-sm text-caldera-text-secondary">
                    Daily limits reset at midnight UTC. Current utilization: {spentPercentage.toFixed(1)}%
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Update Daily Limit
                </Button>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-display font-bold text-caldera-black">Quick Actions</h3>
                <p className="text-sm text-caldera-text-muted">Common vault management tasks</p>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <div>
                    <p className="font-medium text-caldera-black">Vault Status</p>
                    <p className="text-xs text-caldera-text-muted mt-1">
                      {!vault.isActive ? 'All transactions are currently blocked' : 'Vault is active and processing transactions'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePause}
                    disabled={togglingPause}
                    className="rounded-xl border-gray-200"
                  >
                    {togglingPause ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : !vault.isActive ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full rounded-xl border-gray-200"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Open Full Settings Dialog
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings Dialog */}
        <VaultSettingsDialog
          vault={vault}
          balance={balance}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onUpdate={() => refetch()}
        />
      </div>
    </TooltipProvider>
  );
}
