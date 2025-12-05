'use client';

import { useState, useMemo } from 'react';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useVaults } from '@/lib/hooks/use-vaults';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatSol, formatRelativeTime, formatAddress, getExplorerUrl, lamportsToSol, calculatePercentage } from '@/lib/utils';
import { TransactionStatus, Transaction } from '@/types/api';
import {
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  ArrowRightLeft,
  Download,
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type DateRange = 'today' | '7days' | '30days' | 'all';
type SortField = 'createdAt' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

export default function TransactionsPage() {
  const { data, isLoading, refetch } = useTransactions({ myTransactions: true });
  const { data: vaultsData } = useVaults({ myVaults: true });
  const transactions = useMemo(() => data?.data?.items || [], [data?.data?.items]);
  const vaults = useMemo(() => vaultsData?.data?.items || [], [vaultsData?.data?.items]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [vaultFilter, setVaultFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const getStatusStyle = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.EXECUTED:
        return 'bg-caldera-success/10 text-caldera-success border-caldera-success/20';
      case TransactionStatus.BLOCKED:
        return 'bg-red-100 text-red-600 border-red-200';
      case TransactionStatus.PENDING:
        return 'bg-caldera-yellow/20 text-yellow-700 border-caldera-yellow/30';
      case TransactionStatus.FAILED:
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.EXECUTED:
        return <CheckCircle2 className="w-3 h-3" />;
      case TransactionStatus.BLOCKED:
        return <XCircle className="w-3 h-3" />;
      case TransactionStatus.PENDING:
        return <Clock className="w-3 h-3" />;
      case TransactionStatus.FAILED:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Vault filter
    if (vaultFilter !== 'all') {
      filtered = filtered.filter(tx => tx.vaultId === vaultFilter);
    }

    // Date range filter
    filtered = filtered.filter((tx: Transaction): boolean => {
      if (dateRange === 'all') return true;

      const now = new Date();
      const txDate = new Date(tx.createdAt);
      const diffInDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);

      switch (dateRange) {
        case 'today':
          return diffInDays < 1;
        case '7days':
          return diffInDays < 7;
        case '30days':
          return diffInDays < 30;
        default:
          return true;
      }
    });

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.signature.toLowerCase().includes(query) ||
        tx.to.toLowerCase().includes(query) ||
        tx.from.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = Number(a.amount) - Number(b.amount);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, statusFilter, vaultFilter, dateRange, searchQuery, sortField, sortOrder]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalVolume = filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const executedTxs = filteredTransactions.filter(tx => tx.status === TransactionStatus.EXECUTED);
    const avgTransactionSize = executedTxs.length > 0
      ? executedTxs.reduce((sum, tx) => sum + Number(tx.amount), 0) / executedTxs.length
      : 0;
    const successRate = filteredTransactions.length > 0
      ? calculatePercentage(executedTxs.length, filteredTransactions.length)
      : 0;

    return {
      totalVolume: lamportsToSol(totalVolume.toString()),
      avgTransactionSize: lamportsToSol(avgTransactionSize.toString()),
      successRate,
      totalCount: filteredTransactions.length,
      executedCount: executedTxs.length,
    };
  }, [filteredTransactions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (vaultFilter !== 'all') count++;
    if (dateRange !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [statusFilter, vaultFilter, dateRange, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-caldera-black">Transactions</h1>
          <p className="text-caldera-text-secondary mt-1">View and manage vault transactions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            className="rounded-xl border-gray-200 hover:bg-gray-100"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-gray-200 hover:bg-gray-100"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-caldera-orange text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            className="hidden sm:flex rounded-xl border-gray-200 hover:bg-gray-100"
            onClick={() => alert('Export functionality coming soon!')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-caldera-text-muted">Total Volume</span>
            <div className="w-8 h-8 rounded-lg bg-caldera-purple/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-caldera-purple" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-caldera-black">
            {stats.totalVolume.toFixed(4)} SOL
          </div>
          <p className="text-xs text-caldera-text-muted mt-1">
            {stats.totalCount} transactions
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-caldera-text-muted">Avg Transaction</span>
            <div className="w-8 h-8 rounded-lg bg-caldera-orange/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-caldera-orange" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-caldera-black">
            {stats.avgTransactionSize.toFixed(4)} SOL
          </div>
          <p className="text-xs text-caldera-text-muted mt-1">
            Per transaction
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-caldera-text-muted">Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-caldera-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-caldera-success" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-caldera-black">
            {stats.successRate.toFixed(1)}%
          </div>
          <p className="text-xs text-caldera-text-muted mt-1">
            {stats.executedCount} executed
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-caldera-text-muted">Total Transactions</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-caldera-black">
            {stats.totalCount}
          </div>
          <p className="text-xs text-caldera-text-muted mt-1">
            In selected period
          </p>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-caldera-black">Filters</h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setVaultFilter('all');
                  setDateRange('all');
                  setSearchQuery('');
                }}
                className="text-sm text-caldera-text-muted hover:text-caldera-black"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-caldera-black mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-caldera-text-muted" />
                <Input
                  type="text"
                  placeholder="Signature or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-caldera-text-muted hover:text-caldera-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-caldera-black mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-caldera-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caldera-orange focus-visible:ring-offset-2"
              >
                <option value="all">All Statuses</option>
                <option value={TransactionStatus.EXECUTED}>Executed</option>
                <option value={TransactionStatus.BLOCKED}>Blocked</option>
                <option value={TransactionStatus.PENDING}>Pending</option>
                <option value={TransactionStatus.FAILED}>Failed</option>
              </select>
            </div>

            {/* Vault Filter */}
            <div>
              <label className="block text-sm font-medium text-caldera-black mb-2">Vault</label>
              <select
                value={vaultFilter}
                onChange={(e) => setVaultFilter(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-caldera-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caldera-orange focus-visible:ring-offset-2"
              >
                <option value="all">All Vaults</option>
                {vaults.map((vault) => (
                  <option key={vault.id} value={vault.id}>
                    {vault.name || formatAddress(vault.publicKey, 4)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-caldera-black mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-caldera-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caldera-orange focus-visible:ring-offset-2"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-caldera-purple" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-caldera-black">
                  {activeFilterCount > 0 ? 'Filtered Transactions' : 'All Transactions'}
                </h2>
                <p className="text-sm text-caldera-text-muted">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
                  {activeFilterCount > 0 && ` (${transactions.length} total)`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-caldera-purple/20 border-t-caldera-purple" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <ArrowRightLeft className="w-10 h-10 text-caldera-text-muted" />
              </div>
              <h3 className="text-xl font-display font-bold text-caldera-black mb-2">
                {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
              </h3>
              <p className="text-caldera-text-secondary max-w-md mx-auto">
                {transactions.length === 0
                  ? 'Transactions from your vaults will appear here.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => {
                    setStatusFilter('all');
                    setVaultFilter('all');
                    setDateRange('all');
                    setSearchQuery('');
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Desktop Table Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-caldera-text-muted uppercase tracking-wide">
                <button
                  onClick={() => handleSort('status')}
                  className="col-span-2 flex items-center gap-1 hover:text-caldera-black transition-colors"
                >
                  Status
                  <SortIcon field="status" />
                </button>
                <button
                  onClick={() => handleSort('createdAt')}
                  className="col-span-2 flex items-center gap-1 hover:text-caldera-black transition-colors"
                >
                  Time
                  <SortIcon field="createdAt" />
                </button>
                <div className="col-span-3">From → To</div>
                <button
                  onClick={() => handleSort('amount')}
                  className="col-span-2 flex items-center gap-1 hover:text-caldera-black transition-colors"
                >
                  Amount
                  <SortIcon field="amount" />
                </button>
                <div className="col-span-2">Vault</div>
                <div className="col-span-1">Link</div>
              </div>

              {/* Transactions */}
              {filteredTransactions.map((tx) => {
                const vault = vaults.find(v => v.id === tx.vaultId);
                return (
                  <div
                    key={tx.id}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 px-4 py-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors items-center"
                  >
                    {/* Status */}
                    <div className="lg:col-span-2 flex items-center justify-between lg:justify-start">
                      <span className="lg:hidden text-xs text-caldera-text-muted">Status</span>
                      <Badge className={`${getStatusStyle(tx.status)} flex items-center gap-1`}>
                        {getStatusIcon(tx.status)}
                        {tx.status}
                      </Badge>
                    </div>

                    {/* Time */}
                    <div className="lg:col-span-2 flex items-center justify-between lg:justify-start">
                      <span className="lg:hidden text-xs text-caldera-text-muted">Time</span>
                      <div className="text-right lg:text-left">
                        <div className="text-sm text-caldera-text-secondary">
                          {formatRelativeTime(tx.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* From → To */}
                    <div className="lg:col-span-3 flex items-center justify-between lg:justify-start">
                      <span className="lg:hidden text-xs text-caldera-text-muted">Route</span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-caldera-black">
                          {formatAddress(tx.from, 3)}
                        </span>
                        <span className="text-caldera-text-muted">→</span>
                        <span className="font-mono text-caldera-black">
                          {formatAddress(tx.to, 3)}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="lg:col-span-2 flex items-center justify-between lg:justify-start">
                      <span className="lg:hidden text-xs text-caldera-text-muted">Amount</span>
                      <div>
                        <div className="font-semibold text-caldera-black">
                          {formatSol(tx.amount)} SOL
                        </div>
                      </div>
                    </div>

                    {/* Vault */}
                    <div className="lg:col-span-2 flex items-center justify-between lg:justify-start">
                      <span className="lg:hidden text-xs text-caldera-text-muted">Vault</span>
                      <div>
                        <div className="text-sm text-caldera-black font-medium">
                          {vault?.name || formatAddress(tx.vaultId, 3)}
                        </div>
                        {vault?.name && (
                          <div className="text-xs text-caldera-text-muted font-mono">
                            {formatAddress(tx.vaultId, 3)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Explorer Link */}
                    <div className="lg:col-span-1 flex items-center justify-between lg:justify-start">
                      <span className="lg:hidden text-xs text-caldera-text-muted">Explorer</span>
                      <a
                        href={getExplorerUrl('tx', tx.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white transition-colors"
                        title="View on Solscan"
                      >
                        <ExternalLink className="w-4 h-4 text-caldera-purple" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
