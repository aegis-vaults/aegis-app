'use client';

import { useParams } from 'next/navigation';
import { useVault } from '@/lib/hooks/use-vaults';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultCredentials } from '@/components/vault/vault-credentials';
import { VaultSettingsDialog } from '@/components/vault/vault-settings-dialog';
import { formatSol, formatAddress } from '@/lib/utils';
import { ArrowLeft, Wallet, TrendingUp, History, Settings, Pause, Play, Loader2, RefreshCw, Shield } from 'lucide-react';
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

  return (
    <div className="space-y-6">
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
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-gray-200 hover:bg-gray-100"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-caldera-success" />
            </div>
            <span className="text-caldera-text-secondary text-sm">Balance</span>
          </div>
          <div className="text-2xl font-display font-black text-caldera-success">
            {loadingBalance ? 'Loading...' : `${balance.toFixed(4)} SOL`}
          </div>
        </div>

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
              <History className="w-5 h-5 text-caldera-purple" />
            </div>
            <span className="text-caldera-text-secondary text-sm">Transactions</span>
          </div>
          <div className="text-2xl font-display font-black text-caldera-black">
            {vault.transactions?.length || 0}
          </div>
          <div className="text-xs text-caldera-text-muted mt-2">
            All time
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="integration" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-xl p-1 h-12">
          <TabsTrigger value="integration" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Integration</TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Transactions</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Analytics</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Settings</TabsTrigger>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-display font-bold text-caldera-black">Vault Analytics</h3>
              <p className="text-sm text-caldera-text-muted">Spending patterns and insights</p>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-caldera-text-muted" />
                </div>
                <p className="text-caldera-text-secondary font-medium">Analytics coming soon</p>
                <p className="text-xs text-caldera-text-muted mt-1">
                  Track spending patterns, success rates, and more
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-display font-bold text-caldera-black">Vault Settings</h3>
              <p className="text-sm text-caldera-text-muted">Manage vault configuration and policies</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Pause/Resume */}
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

              {/* Whitelist */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <p className="font-medium text-caldera-black">Whitelist</p>
                  <p className="text-xs text-caldera-text-muted mt-1">
                    {vault.whitelist?.length || 0} addresses whitelisted
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="rounded-xl border-gray-200"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>

              {/* Daily Limit */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <p className="font-medium text-caldera-black">Daily Limit</p>
                  <p className="text-xs text-caldera-text-muted mt-1">
                    Current limit: {formatSol(vault.dailyLimit)} SOL
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="rounded-xl border-gray-200"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Update
                </Button>
              </div>

              {/* Open Full Settings */}
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl border-gray-200"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Open Full Settings
                </Button>
              </div>
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
  );
}
