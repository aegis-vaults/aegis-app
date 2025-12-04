'use client';

import { useTransactions } from '@/lib/hooks/use-transactions';
import { Badge } from '@/components/ui/badge';
import { formatSol, formatRelativeTime, formatAddress, getExplorerUrl } from '@/lib/utils';
import { TransactionStatus } from '@/types/api';
import { ExternalLink, Search, Filter, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TransactionsPage() {
  const { data, isLoading, refetch } = useTransactions({ myTransactions: true });
  const transactions = data?.data?.items || [];

  const getStatusStyle = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.EXECUTED:
        return 'bg-caldera-success/10 text-caldera-success border-caldera-success/20';
      case TransactionStatus.BLOCKED:
        return 'bg-red-100 text-red-600 border-red-200';
      case TransactionStatus.PENDING:
        return 'bg-caldera-yellow/20 text-yellow-700 border-caldera-yellow/30';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

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
          <Button variant="outline" className="hidden sm:flex rounded-xl border-gray-200 hover:bg-gray-100">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="hidden sm:flex rounded-xl border-gray-200 hover:bg-gray-100">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-caldera-purple/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-caldera-purple" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-caldera-black">All Transactions</h2>
              <p className="text-sm text-caldera-text-muted">{transactions.length} transactions</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-caldera-purple/20 border-t-caldera-purple" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <ArrowRightLeft className="w-10 h-10 text-caldera-text-muted" />
              </div>
              <h3 className="text-xl font-display font-bold text-caldera-black mb-2">No transactions yet</h3>
              <p className="text-caldera-text-secondary max-w-md mx-auto">
                Transactions from your vaults will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Desktop Table Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-caldera-text-muted uppercase tracking-wide">
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-3">From → To</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Vault</div>
                <div className="col-span-1">Link</div>
              </div>

              {/* Transactions */}
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 px-4 py-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors items-center"
                >
                  {/* Status */}
                  <div className="lg:col-span-2 flex items-center justify-between lg:justify-start">
                    <span className="lg:hidden text-xs text-caldera-text-muted">Status</span>
                    <Badge className={getStatusStyle(tx.status)}>
                      {tx.status}
                    </Badge>
                  </div>

                  {/* Time */}
                  <div className="lg:col-span-2 flex items-center justify-between lg:justify-start">
                    <span className="lg:hidden text-xs text-caldera-text-muted">Time</span>
                    <span className="text-sm text-caldera-text-secondary">
                      {formatRelativeTime(tx.createdAt)}
                    </span>
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
                    <span className="font-semibold text-caldera-black">
                      {formatSol(tx.amount)} SOL
                    </span>
                  </div>

                  {/* Vault */}
                  <div className="lg:col-span-2 flex items-center justify-between lg:justify-start">
                    <span className="lg:hidden text-xs text-caldera-text-muted">Vault</span>
                    <span className="text-sm text-caldera-text-secondary font-mono">
                      {formatAddress(tx.vaultId, 3)}
                    </span>
                  </div>

                  {/* Explorer Link */}
                  <div className="lg:col-span-1 flex items-center justify-between lg:justify-start">
                    <span className="lg:hidden text-xs text-caldera-text-muted">Explorer</span>
                    <a
                      href={getExplorerUrl('tx', tx.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-caldera-purple" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
