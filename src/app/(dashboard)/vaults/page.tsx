'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useVaults } from '@/lib/hooks/use-vaults';
import { useMultipleAgentBalances } from '@/lib/hooks/use-agent-balance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatSol, formatAddress } from '@/lib/utils';
import {
  Plus,
  Vault as VaultIcon,
  Settings,
  Pause,
  Play,
  Wallet,
  RefreshCw,
  Code2,
  Loader2,
  Grid3x3,
  List,
  Search,
  Filter,
  AlertCircle,
  Activity,
  TrendingUp,
  X,
  DollarSign,
} from 'lucide-react';
import { CreateVaultDialog } from '@/components/vault/create-vault-dialog';
import { VaultSettingsDialog } from '@/components/vault/vault-settings-dialog';
import { getConnection } from '@/lib/solana/config';
import { PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getVaultAuthorityPDA } from '@/lib/solana/program';
import { instructions } from '@/lib/solana/instructions';
import { Vault } from '@/types/api';
import {
  calculateVaultHealth,
  getHealthScoreColor,
  getHealthScoreBgColor,
  getHealthStatusColor,
  VaultHealthMetrics,
} from '@/lib/utils/vault-health';
import {
  getAgentBalanceColor,
  getAgentBalanceBgColor,
  getAgentBalanceBorderColor,
} from '@/lib/hooks/use-agent-balance';

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'paused';
type HealthFilter = 'all' | 'healthy' | 'issues' | 'critical';
type SortField = 'name' | 'balance' | 'health' | 'activity';
type SortDirection = 'asc' | 'desc';

export default function VaultsPage() {
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;
  const { data, isLoading, refetch } = useVaults({ myVaults: true });
  const vaults = data?.data?.items || [];

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Bulk actions
  const [selectedVaultIds, setSelectedVaultIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Individual vault state
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [togglingVault, setTogglingVault] = useState<string | null>(null);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Fetch agent balances for all vaults
  const agentPublicKeys = useMemo(() => {
    return vaults
      .filter(v => v.agentSigner)
      .map(v => v.agentSigner);
  }, [vaults]);

  const { data: agentBalances } = useMultipleAgentBalances(agentPublicKeys);

  // Calculate health metrics for all vaults
  const vaultHealthMetrics = useMemo<Record<string, VaultHealthMetrics>>(() => {
    const metrics: Record<string, VaultHealthMetrics> = {};

    for (const vault of vaults) {
      const agentBalance = agentBalances?.[vault.agentSigner]?.balance || 0;
      const vaultBalance = balances[vault.publicKey] || 0;

      // Get transaction stats (mock for now - would come from API in production)
      const totalTransactions = vault.transactions?.length || 0;
      const successfulTransactions = vault.transactions?.filter(t => t.status === 'EXECUTED').length || 0;
      const blockedTransactions = vault.transactions?.filter(t => t.status === 'BLOCKED').length || 0;

      metrics[vault.id] = calculateVaultHealth({
        vaultBalance,
        agentBalance,
        dailyLimit: Number(vault.dailyLimit),
        dailySpent: Number(vault.dailySpent),
        isPaused: vault.paused || !vault.isActive,
        lastActivityTimestamp: vault.updatedAt ? new Date(vault.updatedAt).getTime() : undefined,
        totalTransactions,
        successfulTransactions,
        blockedTransactions,
        hasWhitelist: vault.whitelistEnabled,
        whitelistCount: vault.whitelist?.length || 0,
        hasAgentSigner: !!vault.agentSigner,
      });
    }

    return metrics;
  }, [vaults, balances, agentBalances]);

  const fetchBalances = async () => {
    if (vaults.length === 0) return;

    setLoadingBalances(true);
    const connection = getConnection();
    const newBalances: Record<string, number> = {};

    for (const vault of vaults) {
      try {
        const vaultPubkey = new PublicKey(vault.publicKey);
        const [vaultAuthority] = getVaultAuthorityPDA(vaultPubkey);
        const balance = await connection.getBalance(vaultAuthority);
        newBalances[vault.publicKey] = balance / LAMPORTS_PER_SOL;
      } catch (error) {
        console.error(`Error fetching balance for vault ${vault.publicKey}:`, error);
        newBalances[vault.publicKey] = 0;
      }
    }

    setBalances(newBalances);
    setLoadingBalances(false);
  };

  useEffect(() => {
    if (vaults.length > 0) {
      fetchBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaults.length]);

  const handleOpenSettings = (vault: Vault) => {
    setSelectedVault(vault);
    setSettingsOpen(true);
  };

  const handlePauseToggle = async (vault: Vault) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    const isPaused = !vault.isActive;
    const action = isPaused ? 'resume' : 'pause';

    setTogglingVault(vault.id);
    try {
      const connection: Connection = getConnection();
      const vaultPubkey = new PublicKey(vault.publicKey);
      const vaultNonce = BigInt(vault.vaultNonce || '0');

      const { transaction } = isPaused
        ? await instructions.resumeVault(wallet as any, vaultPubkey, vaultNonce)
        : await instructions.pauseVault(wallet as any, vaultPubkey, vaultNonce);

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
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
      setTogglingVault(null);
    }
  };

  // Bulk actions handlers
  const handleSelectAll = () => {
    if (selectedVaultIds.size === filteredVaults.length) {
      setSelectedVaultIds(new Set());
    } else {
      setSelectedVaultIds(new Set(filteredVaults.map(v => v.id)));
    }
  };

  const handleSelectVault = (vaultId: string) => {
    const newSelected = new Set(selectedVaultIds);
    if (newSelected.has(vaultId)) {
      newSelected.delete(vaultId);
    } else {
      newSelected.add(vaultId);
    }
    setSelectedVaultIds(newSelected);
  };

  const handleBulkPause = async () => {
    if (!publicKey || !signTransaction || selectedVaultIds.size === 0) return;

    setBulkActionLoading(true);
    let successCount = 0;

    for (const vaultId of Array.from(selectedVaultIds)) {
      const vault = vaults.find(v => v.id === vaultId);
      if (!vault || !vault.isActive) continue;

      try {
        await handlePauseToggle(vault);
        successCount++;
      } catch (error) {
        console.error(`Failed to pause vault ${vaultId}:`, error);
      }
    }

    setBulkActionLoading(false);
    setSelectedVaultIds(new Set());
    toast.success(`Paused ${successCount} vault(s)`);
  };

  const handleBulkResume = async () => {
    if (!publicKey || !signTransaction || selectedVaultIds.size === 0) return;

    setBulkActionLoading(true);
    let successCount = 0;

    for (const vaultId of Array.from(selectedVaultIds)) {
      const vault = vaults.find(v => v.id === vaultId);
      if (!vault || vault.isActive) continue;

      try {
        await handlePauseToggle(vault);
        successCount++;
      } catch (error) {
        console.error(`Failed to resume vault ${vaultId}:`, error);
      }
    }

    setBulkActionLoading(false);
    setSelectedVaultIds(new Set());
    toast.success(`Resumed ${successCount} vault(s)`);
  };

  // Filter and sort vaults
  const filteredVaults = useMemo(() => {
    let filtered = [...vaults];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        v =>
          v.name?.toLowerCase().includes(query) ||
          v.publicKey.toLowerCase().includes(query) ||
          v.agentSigner?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(v => v.isActive && !v.paused);
    } else if (statusFilter === 'paused') {
      filtered = filtered.filter(v => !v.isActive || v.paused);
    }

    // Health filter
    if (healthFilter !== 'all') {
      filtered = filtered.filter(v => {
        const health = vaultHealthMetrics[v.id];
        if (!health) return false;

        if (healthFilter === 'healthy') {
          return health.score >= 75;
        } else if (healthFilter === 'issues') {
          return health.score >= 25 && health.score < 75;
        } else if (healthFilter === 'critical') {
          return health.score < 25;
        }
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'balance':
          comparison = (balances[a.publicKey] || 0) - (balances[b.publicKey] || 0);
          break;
        case 'health':
          const healthA = vaultHealthMetrics[a.id]?.score || 0;
          const healthB = vaultHealthMetrics[b.id]?.score || 0;
          comparison = healthA - healthB;
          break;
        case 'activity':
          const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          comparison = timeA - timeB;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [vaults, searchQuery, statusFilter, healthFilter, sortField, sortDirection, vaultHealthMetrics, balances]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setHealthFilter('all');
    setSortField('name');
    setSortDirection('asc');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || healthFilter !== 'all';

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-caldera-black">Vaults</h1>
            <p className="text-caldera-text-secondary mt-1">
              Manage your AI agent vaults {vaults.length > 0 && `(${vaults.length})`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                refetch();
                fetchBalances();
              }}
              disabled={loadingBalances}
              className="rounded-xl border-gray-200 hover:bg-gray-100"
            >
              <RefreshCw className={`w-4 h-4 ${loadingBalances ? 'animate-spin' : ''}`} />
            </Button>
            <CreateVaultDialog onSuccess={() => refetch()} />
          </div>
        </div>

        {/* Filters & Bulk Actions */}
        {vaults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={healthFilter} onValueChange={(v: string) => setHealthFilter(v as HealthFilter)}>
                  <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
                    <SelectValue placeholder="Health" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Health</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="issues">Has Issues</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortField} onValueChange={(v: string) => setSortField(v as SortField)}>
                  <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="balance">Balance</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="rounded-xl border-gray-200"
                  title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <TrendingUp className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFilters}
                    className="rounded-xl text-red-600 hover:bg-red-50"
                    title="Clear filters"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedVaultIds.size > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-caldera-text-secondary">
                  {selectedVaultIds.size} vault(s) selected
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkPause}
                    disabled={bulkActionLoading}
                    className="rounded-xl border-gray-200"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkResume}
                    disabled={bulkActionLoading}
                    className="rounded-xl border-gray-200"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedVaultIds(new Set())}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-caldera-orange/20 border-t-caldera-orange" />
          </div>
        ) : vaults.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                <VaultIcon className="w-10 h-10 text-caldera-text-muted" />
              </div>
              <h3 className="text-xl font-display font-bold text-caldera-black mb-2">No vaults yet</h3>
              <p className="text-caldera-text-secondary max-w-md mb-6">
                Create your first vault to start managing AI agent transactions with programmable guardrails.
              </p>
              <CreateVaultDialog onSuccess={() => refetch()} />
            </div>
          </div>
        ) : filteredVaults.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                <Filter className="w-10 h-10 text-caldera-text-muted" />
              </div>
              <h3 className="text-xl font-display font-bold text-caldera-black mb-2">No vaults found</h3>
              <p className="text-caldera-text-secondary max-w-md mb-6">
                No vaults match your current filters. Try adjusting your search or filter criteria.
              </p>
              <Button variant="outline" onClick={handleClearFilters} className="rounded-xl">
                Clear Filters
              </Button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <VaultGridView
            vaults={filteredVaults}
            balances={balances}
            agentBalances={agentBalances}
            healthMetrics={vaultHealthMetrics}
            selectedVaultIds={selectedVaultIds}
            loadingBalances={loadingBalances}
            togglingVault={togglingVault}
            onSelectVault={handleSelectVault}
            onOpenSettings={handleOpenSettings}
            onPauseToggle={handlePauseToggle}
          />
        ) : (
          <VaultTableView
            vaults={filteredVaults}
            balances={balances}
            agentBalances={agentBalances}
            healthMetrics={vaultHealthMetrics}
            selectedVaultIds={selectedVaultIds}
            loadingBalances={loadingBalances}
            togglingVault={togglingVault}
            onSelectAll={handleSelectAll}
            onSelectVault={handleSelectVault}
            onOpenSettings={handleOpenSettings}
            onPauseToggle={handlePauseToggle}
          />
        )}

        {/* Settings Dialog */}
        {selectedVault && (
          <VaultSettingsDialog
            vault={selectedVault}
            balance={balances[selectedVault.publicKey]}
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            onUpdate={() => refetch()}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// Grid View Component
interface VaultViewProps {
  vaults: Vault[];
  balances: Record<string, number>;
  agentBalances: any;
  healthMetrics: Record<string, VaultHealthMetrics>;
  selectedVaultIds: Set<string>;
  loadingBalances: boolean;
  togglingVault: string | null;
  onSelectVault: (id: string) => void;
  onOpenSettings: (vault: Vault) => void;
  onPauseToggle: (vault: Vault) => void;
}

function VaultGridView({
  vaults,
  balances,
  agentBalances,
  healthMetrics,
  selectedVaultIds,
  loadingBalances,
  togglingVault,
  onSelectVault,
  onOpenSettings,
  onPauseToggle,
}: VaultViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vaults.map((vault) => {
        const health = healthMetrics[vault.id];
        const agentBalance = agentBalances?.[vault.agentSigner];
        const isSelected = selectedVaultIds.has(vault.id);

        return (
          <div
            key={vault.id}
            className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all relative ${
              isSelected
                ? 'border-caldera-orange ring-2 ring-caldera-orange/20'
                : 'border-gray-100 hover:border-caldera-orange/20'
            }`}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-4 left-4 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelectVault(vault.id)}
                className="bg-white border-gray-300 data-[state=checked]:bg-caldera-orange data-[state=checked]:border-caldera-orange"
              />
            </div>

            {/* Health Score Badge */}
            {health && (
              <div className="absolute top-4 right-4 z-10">
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className={`${getHealthStatusColor(health.status)} font-bold`}>
                      {health.score}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-semibold">Health Score: {health.score}/100</p>
                      {health.issues.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-600">Issues:</p>
                          {health.issues.map((issue, i) => (
                            <p key={i} className="text-xs">• {issue}</p>
                          ))}
                        </div>
                      )}
                      {health.warnings.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-yellow-600">Warnings:</p>
                          {health.warnings.map((warning, i) => (
                            <p key={i} className="text-xs">• {warning}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            <div className="p-6 pt-12">
              {/* Vault Name & Address */}
              <div className="mb-4">
                <h3 className="text-lg font-display font-bold text-caldera-black truncate">
                  {vault.name || 'Unnamed Vault'}
                </h3>
                <p className="font-mono text-xs text-caldera-text-muted mt-1">
                  {formatAddress(vault.publicKey)}
                </p>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <Badge
                  className={
                    vault.isActive && !vault.paused
                      ? 'bg-caldera-success/10 text-caldera-success border-caldera-success/20'
                      : 'bg-gray-100 text-caldera-text-muted border-gray-200'
                  }
                >
                  {vault.isActive && !vault.paused ? 'Active' : 'Paused'}
                </Badge>
              </div>

              {/* Vault Balance */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-caldera-success" />
                </div>
                <div className="flex-1">
                  <div className="text-xl font-display font-black text-caldera-success">
                    {loadingBalances ? (
                      <span className="text-caldera-text-muted text-base">Loading...</span>
                    ) : (
                      <>{(balances[vault.publicKey] || 0).toFixed(4)} SOL</>
                    )}
                  </div>
                  <p className="text-xs text-caldera-text-muted">Vault Balance</p>
                </div>
              </div>

              {/* Agent Balance */}
              {agentBalance && (
                <div className="mb-4">
                  <div
                    className={`p-3 rounded-xl border ${getAgentBalanceBgColor(
                      agentBalance.status
                    )} ${getAgentBalanceBorderColor(agentBalance.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${getAgentBalanceColor(agentBalance.status)}`} />
                        <span className="text-sm font-medium text-caldera-black">Agent Balance</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${getAgentBalanceColor(agentBalance.status)}`}>
                          {agentBalance.balance.toFixed(4)} SOL
                        </p>
                        <p className="text-xs text-caldera-text-muted">
                          ~{agentBalance.estimatedTransactions} txs
                        </p>
                      </div>
                    </div>
                    {(agentBalance.isLow || agentBalance.isCritical) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 rounded-lg border-current"
                        onClick={() => {
                          // TODO: Open fund dialog
                          toast.info('Fund agent wallet feature coming soon');
                        }}
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        Fund Agent
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Daily Limit Progress */}
              <div className="p-3 rounded-xl bg-gray-50 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-caldera-text-secondary">Daily Limit</span>
                  <span className="text-xs font-medium text-caldera-black">
                    {formatSol(vault.dailyLimit)} SOL
                  </span>
                </div>
                <div className="flex justify-between text-xs text-caldera-text-muted mb-2">
                  <span>Spent</span>
                  <span>
                    {formatSol(vault.dailySpent)} / {formatSol(vault.dailyLimit)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-caldera-orange to-caldera-purple transition-all rounded-full"
                    style={{
                      width: `${Math.min(
                        (Number(vault.dailySpent) / Number(vault.dailyLimit)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Recent Activity */}
              {vault.updatedAt && (
                <div className="flex items-center gap-2 text-xs text-caldera-text-muted mb-4">
                  <Activity className="w-3 h-3" />
                  <span>
                    Last activity:{' '}
                    {new Date(vault.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-xl border-gray-200 hover:bg-gray-100 hover:border-caldera-orange/30"
                  onClick={() => (window.location.href = `/vaults/${vault.id}`)}
                >
                  <Code2 className="w-4 h-4 mr-2" />
                  Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:bg-gray-100 px-3"
                  onClick={() => onOpenSettings(vault)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-gray-200 hover:bg-gray-100 px-3"
                  onClick={() => onPauseToggle(vault)}
                  disabled={togglingVault === vault.id}
                  title={vault.isActive && !vault.paused ? 'Pause vault' : 'Resume vault'}
                >
                  {togglingVault === vault.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : vault.isActive && !vault.paused ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Table View Component
interface VaultTableViewProps extends VaultViewProps {
  onSelectAll: () => void;
}

function VaultTableView({
  vaults,
  balances,
  agentBalances,
  healthMetrics,
  selectedVaultIds,
  loadingBalances,
  togglingVault,
  onSelectAll,
  onSelectVault,
  onOpenSettings,
  onPauseToggle,
}: VaultTableViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={selectedVaultIds.size === vaults.length && vaults.length > 0}
                  onCheckedChange={onSelectAll}
                  className="border-gray-300 data-[state=checked]:bg-caldera-orange data-[state=checked]:border-caldera-orange"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-caldera-text-secondary uppercase tracking-wider">
                Vault
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-caldera-text-secondary uppercase tracking-wider">
                Health
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-caldera-text-secondary uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-caldera-text-secondary uppercase tracking-wider">
                Agent Balance
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-caldera-text-secondary uppercase tracking-wider">
                Daily Limit
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-caldera-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-caldera-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vaults.map((vault) => {
              const health = healthMetrics[vault.id];
              const agentBalance = agentBalances?.[vault.agentSigner];
              const isSelected = selectedVaultIds.has(vault.id);

              return (
                <tr
                  key={vault.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-caldera-orange/5' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectVault(vault.id)}
                      className="border-gray-300 data-[state=checked]:bg-caldera-orange data-[state=checked]:border-caldera-orange"
                    />
                  </td>

                  {/* Vault Name */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-caldera-black">
                        {vault.name || 'Unnamed Vault'}
                      </p>
                      <p className="text-xs font-mono text-caldera-text-muted">
                        {formatAddress(vault.publicKey)}
                      </p>
                    </div>
                  </td>

                  {/* Health */}
                  <td className="px-6 py-4">
                    {health && (
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                health.score >= 75
                                  ? 'bg-caldera-success'
                                  : health.score >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                            />
                            <span className={`font-bold ${getHealthScoreColor(health.score)}`}>
                              {health.score}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2">
                            <p className="font-semibold">Health Score: {health.score}/100</p>
                            {health.issues.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-red-600">Issues:</p>
                                {health.issues.map((issue, i) => (
                                  <p key={i} className="text-xs">
                                    • {issue}
                                  </p>
                                ))}
                              </div>
                            )}
                            {health.warnings.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-yellow-600">Warnings:</p>
                                {health.warnings.map((warning, i) => (
                                  <p key={i} className="text-xs">
                                    • {warning}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </td>

                  {/* Vault Balance */}
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-caldera-success">
                      {loadingBalances ? '...' : `${(balances[vault.publicKey] || 0).toFixed(4)}`}
                    </p>
                    <p className="text-xs text-caldera-text-muted">SOL</p>
                  </td>

                  {/* Agent Balance */}
                  <td className="px-6 py-4 text-right">
                    {agentBalance ? (
                      <div>
                        <p className={`font-bold ${getAgentBalanceColor(agentBalance.status)}`}>
                          {agentBalance.balance.toFixed(4)}
                        </p>
                        <p className="text-xs text-caldera-text-muted">
                          ~{agentBalance.estimatedTransactions} txs
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-caldera-text-muted">N/A</p>
                    )}
                  </td>

                  {/* Daily Limit */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-sm font-medium text-caldera-black">
                        {formatSol(vault.dailyLimit)} SOL
                      </p>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-caldera-orange to-caldera-purple"
                          style={{
                            width: `${Math.min(
                              (Number(vault.dailySpent) / Number(vault.dailyLimit)) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-caldera-text-muted">
                        {formatSol(vault.dailySpent)} spent
                      </p>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <Badge
                      className={
                        vault.isActive && !vault.paused
                          ? 'bg-caldera-success/10 text-caldera-success border-caldera-success/20'
                          : 'bg-gray-100 text-caldera-text-muted border-gray-200'
                      }
                    >
                      {vault.isActive && !vault.paused ? 'Active' : 'Paused'}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg hover:bg-gray-100"
                        onClick={() => (window.location.href = `/vaults/${vault.id}`)}
                      >
                        <Code2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg hover:bg-gray-100"
                        onClick={() => onOpenSettings(vault)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg hover:bg-gray-100"
                        onClick={() => onPauseToggle(vault)}
                        disabled={togglingVault === vault.id}
                        title={vault.isActive && !vault.paused ? 'Pause vault' : 'Resume vault'}
                      >
                        {togglingVault === vault.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : vault.isActive && !vault.paused ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
