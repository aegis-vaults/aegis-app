'use client';

import { useTransactions } from '@/lib/hooks/use-transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatSol, formatRelativeTime, formatAddress, getExplorerUrl } from '@/lib/utils';
import { TransactionStatus } from '@/types/api';
import { ExternalLink, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TransactionsPage() {
  const { data, isLoading } = useTransactions();
  const transactions = data?.data?.items || [];

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.EXECUTED:
        return 'bg-aegis-emerald/20 text-aegis-emerald border-aegis-emerald/30';
      case TransactionStatus.BLOCKED:
        return 'bg-aegis-crimson/20 text-aegis-crimson border-aegis-crimson/30';
      case TransactionStatus.PENDING:
        return 'bg-aegis-amber/20 text-aegis-amber border-aegis-amber/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-aegis-text-primary">Transactions</h1>
          <p className="text-aegis-text-secondary mt-1">View all vault transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-aegis-blue border-t-transparent"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-aegis-text-secondary">
              No transactions yet.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-aegis-text-tertiary uppercase">
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-3">From → To</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Vault</div>
                <div className="col-span-1">Link</div>
              </div>

              {/* Table Body */}
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg bg-aegis-bg-tertiary/50 hover:bg-aegis-bg-tertiary transition-colors items-center"
                >
                  {/* Status */}
                  <div className="col-span-2">
                    <Badge className={getStatusColor(tx.status)}>
                      {tx.status}
                    </Badge>
                  </div>

                  {/* Time */}
                  <div className="col-span-2 text-sm text-aegis-text-secondary">
                    {formatRelativeTime(tx.createdAt)}
                  </div>

                  {/* From → To */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-aegis-text-primary">
                        {formatAddress(tx.from, 3)}
                      </span>
                      <span className="text-aegis-text-tertiary">→</span>
                      <span className="font-mono text-aegis-text-primary">
                        {formatAddress(tx.to, 3)}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    <div className="font-medium text-aegis-text-primary">
                      {formatSol(tx.amount)} SOL
                    </div>
                  </div>

                  {/* Vault */}
                  <div className="col-span-2 text-sm text-aegis-text-secondary font-mono">
                    {formatAddress(tx.vaultId, 3)}
                  </div>

                  {/* Explorer Link */}
                  <div className="col-span-1">
                    <a
                      href={getExplorerUrl('tx', tx.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-aegis-blue" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

