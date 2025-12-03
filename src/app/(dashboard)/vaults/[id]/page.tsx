'use client';

import { useParams } from 'next/navigation';
import { useVault } from '@/lib/hooks/use-vaults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultCredentials } from '@/components/vault/vault-credentials';
import { VaultSettingsDialog } from '@/components/vault/vault-settings-dialog';
import { formatSol, formatAddress } from '@/lib/utils';
import { ArrowLeft, Wallet, TrendingUp, History, Settings, Pause, Play, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { LAMPORTS_PER_SOL } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { getConnection } from '@/lib/solana/config';
import { PublicKey, Connection } from '@solana/web3.js';
import { getVaultAuthorityPDA } from '@/lib/solana/program';
import { useWallet } from '@solana/wallet-adapter-react';
import { instructions } from '@/lib/solana/instructions';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function VaultDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const wallet = useWallet();
  
  const { data: vaultData, isLoading, refetch } = useVault(id);
  const vault = vaultData?.data;

  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Fetch vault balance
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

      // Build the appropriate transaction
      const { transaction } = isPaused
        ? await instructions.resumeVault(wallet as any, vaultPubkey, vaultNonce)
        : await instructions.pauseVault(wallet as any, vaultPubkey, vaultNonce);

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      // Update backend
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

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl sm:text-2xl font-bold text-aegis-text-primary mb-4">Invalid Vault ID</h2>
        <Link href="/vaults">
          <Button variant="outline">
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
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-aegis-blue border-t-transparent"></div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl sm:text-2xl font-bold text-aegis-text-primary mb-4">Vault Not Found</h2>
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/vaults">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-aegis-text-primary truncate">
              {vault.name || 'Unnamed Vault'}
            </h1>
            <p className="text-aegis-text-secondary text-xs sm:text-sm mt-0.5 sm:mt-1">
              Created {new Date(vault.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-10 sm:pl-0">
          <Badge variant={vault.isActive ? 'default' : 'outline'} className="text-xs sm:text-sm">
            {vault.isActive ? 'Active' : 'Paused'}
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm">
            {vault.tier || 'PERSONAL'}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
              Balance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-aegis-emerald">
              {loadingBalance ? (
                <span className="text-aegis-text-tertiary text-base sm:text-lg">Loading...</span>
              ) : (
                `${balance.toFixed(4)} SOL`
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              Daily Limit
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-aegis-text-primary">
              {formatSol(vault.dailyLimit)} SOL
            </div>
            <div className="text-[10px] sm:text-xs text-aegis-text-tertiary mt-1">
              {formatSol(vault.dailySpent)} spent today ({spentPercentage.toFixed(1)}%)
            </div>
            <div className="h-1.5 sm:h-2 bg-aegis-bg-primary rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-aegis-emerald to-aegis-blue transition-all"
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
              <History className="w-3 h-3 sm:w-4 sm:h-4" />
              Transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-aegis-text-primary">
              {vault.transactions?.length || 0}
            </div>
            <div className="text-[10px] sm:text-xs text-aegis-text-tertiary mt-1">
              All time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="integration" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-aegis-bg-tertiary/50 h-9 sm:h-10">
          <TabsTrigger value="integration" className="text-xs sm:text-sm">Integration</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
        </TabsList>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-4 mt-4 sm:mt-6">
          <VaultCredentials
            vaultAddress={vault.publicKey}
            agentSigner={vault.agentSigner || 'Not set'}
            vaultName={vault.name || undefined}
          />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4 mt-4 sm:mt-6">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Transaction History</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                All transactions executed through this vault
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {vault.transactions && vault.transactions.length > 0 ? (
                <div className="space-y-2">
                  {vault.transactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border"
                    >
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-aegis-text-primary truncate">
                          {formatAddress(tx.to)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-aegis-text-tertiary">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs sm:text-sm font-medium text-aegis-text-primary">
                          {(Number(tx.amount) / LAMPORTS_PER_SOL).toFixed(4)} SOL
                        </div>
                        <Badge variant={tx.status === 'EXECUTED' ? 'default' : 'outline'} className="text-[10px] sm:text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <History className="w-10 h-10 sm:w-12 sm:h-12 text-aegis-text-tertiary mx-auto mb-3 sm:mb-4" />
                  <p className="text-aegis-text-secondary text-sm">No transactions yet</p>
                  <p className="text-[10px] sm:text-xs text-aegis-text-tertiary mt-1">
                    Transactions will appear here once your agent starts using the vault
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 mt-4 sm:mt-6">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Vault Analytics</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Spending patterns and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-center py-8 sm:py-12">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-aegis-text-tertiary mx-auto mb-3 sm:mb-4" />
                <p className="text-aegis-text-secondary text-sm">Analytics coming soon</p>
                <p className="text-[10px] sm:text-xs text-aegis-text-tertiary mt-1">
                  Track spending patterns, success rates, and more
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4 sm:mt-6">
          <Card className="glass-card">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Vault Settings</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage vault configuration and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 pt-0">
              {/* Pause/Resume */}
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-aegis-text-primary">Vault Status</div>
                  <div className="text-[10px] sm:text-xs text-aegis-text-tertiary mt-0.5 sm:mt-1">
                    {!vault.isActive ? 'All transactions are currently blocked' : 'Vault is active and processing transactions'}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTogglePause}
                  disabled={togglingPause}
                  className="shrink-0 ml-2 text-xs sm:text-sm h-8 sm:h-9"
                >
                  {togglingPause ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : !vault.isActive ? (
                    <>
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Pause
                    </>
                  )}
                </Button>
              </div>

              {/* Whitelist */}
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-aegis-text-primary">Whitelist</div>
                  <div className="text-[10px] sm:text-xs text-aegis-text-tertiary mt-0.5 sm:mt-1">
                    {vault.whitelist?.length || 0} addresses whitelisted
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="shrink-0 ml-2 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Manage
                </Button>
              </div>

              {/* Daily Limit */}
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-aegis-bg-tertiary/50 border border-aegis-border">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-aegis-text-primary">Daily Limit</div>
                  <div className="text-[10px] sm:text-xs text-aegis-text-tertiary mt-0.5 sm:mt-1">
                    Current limit: {formatSol(vault.dailyLimit)} SOL
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="shrink-0 ml-2 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Update
                </Button>
              </div>

              {/* Open Full Settings */}
              <div className="pt-2 sm:pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Open Full Settings
                </Button>
              </div>
            </CardContent>
          </Card>
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
  );
}
