'use client';

import { use } from 'react';
import { useVault } from '@/lib/hooks/use-vaults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultCredentials } from '@/components/vault/vault-credentials';
import { formatSol, formatAddress } from '@/lib/utils';
import { ArrowLeft, Wallet, TrendingUp, History, Settings, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import { LAMPORTS_PER_SOL } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { getConnection } from '@/lib/solana/config';
import { PublicKey } from '@solana/web3.js';
import { getVaultAuthorityPDA } from '@/lib/solana/program';

interface VaultDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function VaultDetailPage({ params }: VaultDetailPageProps) {
  const { id } = use(params);
  const { data: vaultData, isLoading } = useVault(id);
  const vault = vaultData?.data;

  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch vault balance
  useEffect(() => {
    async function fetchBalance() {
      if (!vault) return;

      setLoadingBalance(true);
      try {
        const connection = getConnection();
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-aegis-blue border-t-transparent"></div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-aegis-text-primary mb-4">Vault Not Found</h2>
        <Link href="/vaults">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vaults
          </Button>
        </Link>
      </div>
    );
  }

  const spentPercentage = (Number(vault.dailySpent) / Number(vault.dailyLimit)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vaults">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-aegis-text-primary">
              {vault.name || 'Unnamed Vault'}
            </h1>
            <p className="text-aegis-text-secondary text-sm mt-1">
              Created {new Date(vault.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={vault.isActive ? 'default' : 'outline'} className="text-sm">
            {vault.isActive ? 'Active' : 'Paused'}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {vault.tier}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-aegis-emerald">
              {loadingBalance ? (
                <span className="text-aegis-text-tertiary">Loading...</span>
              ) : (
                `${balance.toFixed(4)} SOL`
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Daily Limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-aegis-text-primary">
              {formatSol(vault.dailyLimit)} SOL
            </div>
            <div className="text-xs text-aegis-text-tertiary mt-1">
              {formatSol(vault.dailySpent)} spent today ({spentPercentage.toFixed(1)}%)
            </div>
            <div className="h-2 bg-aegis-bg-primary rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-aegis-emerald to-aegis-blue transition-all"
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-aegis-text-primary">
              {vault.transactions?.length || 0}
            </div>
            <div className="text-xs text-aegis-text-tertiary mt-1">
              All time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="integration" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-aegis-bg-tertiary/50">
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-4 mt-6">
          <VaultCredentials
            vaultAddress={vault.publicKey}
            agentSigner={vault.agentSigner || 'Not set'}
            vaultName={vault.name || undefined}
          />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4 mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All transactions executed through this vault
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vault.transactions && vault.transactions.length > 0 ? (
                <div className="space-y-2">
                  {vault.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border"
                    >
                      <div>
                        <div className="text-sm font-medium text-aegis-text-primary">
                          {formatAddress(tx.to)}
                        </div>
                        <div className="text-xs text-aegis-text-tertiary">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-aegis-text-primary">
                          {(Number(tx.amount) / LAMPORTS_PER_SOL).toFixed(4)} SOL
                        </div>
                        <Badge variant={tx.status === 'EXECUTED' ? 'default' : 'outline'} className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-aegis-text-tertiary mx-auto mb-4" />
                  <p className="text-aegis-text-secondary">No transactions yet</p>
                  <p className="text-xs text-aegis-text-tertiary mt-1">
                    Transactions will appear here once your agent starts using the vault
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Vault Analytics</CardTitle>
              <CardDescription>
                Spending patterns and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-aegis-text-tertiary mx-auto mb-4" />
                <p className="text-aegis-text-secondary">Analytics coming soon</p>
                <p className="text-xs text-aegis-text-tertiary mt-1">
                  Track spending patterns, success rates, and more
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Vault Settings</CardTitle>
              <CardDescription>
                Manage vault configuration and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border">
                <div>
                  <div className="text-sm font-medium text-aegis-text-primary">Vault Status</div>
                  <div className="text-xs text-aegis-text-tertiary mt-1">
                    {vault.paused ? 'All transactions are currently blocked' : 'Vault is active and processing transactions'}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {vault.paused ? (
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

              <div className="flex items-center justify-between p-4 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border">
                <div>
                  <div className="text-sm font-medium text-aegis-text-primary">Whitelist</div>
                  <div className="text-xs text-aegis-text-tertiary mt-1">
                    {vault.whitelist.length} addresses whitelisted
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border">
                <div>
                  <div className="text-sm font-medium text-aegis-text-primary">Daily Limit</div>
                  <div className="text-xs text-aegis-text-tertiary mt-1">
                    Current limit: {formatSol(vault.dailyLimit)} SOL
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
