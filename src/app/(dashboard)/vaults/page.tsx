'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useVaults } from '@/lib/hooks/use-vaults';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatSol, formatAddress } from '@/lib/utils';
import { Plus, Vault as VaultIcon, Settings, Pause, Play, Wallet, RefreshCw, Code2, Loader2 } from 'lucide-react';
import { CreateVaultDialog } from '@/components/vault/create-vault-dialog';
import { VaultSettingsDialog } from '@/components/vault/vault-settings-dialog';
import { getConnection } from '@/lib/solana/config';
import { PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getVaultAuthorityPDA } from '@/lib/solana/program';
import { instructions } from '@/lib/solana/instructions';

export default function VaultsPage() {
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;
  const { data, isLoading, refetch } = useVaults({ myVaults: true });
  const vaults = data?.data?.items || [];
  
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [togglingVault, setTogglingVault] = useState<string | null>(null);
  const [selectedVault, setSelectedVault] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
  }, [vaults.length]);

  const handleOpenSettings = (vault: any) => {
    setSelectedVault(vault);
    setSettingsOpen(true);
  };

  const handlePauseToggle = async (vault: any) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-caldera-black">Vaults</h1>
          <p className="text-caldera-text-secondary mt-1">Manage your AI agent vaults</p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Vaults Grid */}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault) => (
            <div 
              key={vault.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-caldera-orange/20 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-display font-bold text-caldera-black truncate">
                      {vault.name || 'Unnamed Vault'}
                    </h3>
                    <p className="font-mono text-xs text-caldera-text-muted mt-1">
                      {formatAddress(vault.publicKey)}
                    </p>
                    {vault.agentSigner && (
                      <p className="font-mono text-xs text-caldera-purple mt-1">
                        Agent: {formatAddress(vault.agentSigner)}
                      </p>
                    )}
                  </div>
                  <Badge 
                    className={vault.isActive 
                      ? 'bg-caldera-success/10 text-caldera-success border-caldera-success/20' 
                      : 'bg-gray-100 text-caldera-text-muted border-gray-200'
                    }
                  >
                    {vault.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </div>

                {/* Balance */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-caldera-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-black text-caldera-success">
                      {loadingBalances ? (
                        <span className="text-caldera-text-muted text-lg">Loading...</span>
                      ) : (
                        <>{(balances[vault.publicKey] || 0).toFixed(4)} SOL</>
                      )}
                    </div>
                    <p className="text-xs text-caldera-text-muted">Vault Balance</p>
                  </div>
                </div>

                {/* Daily Limit */}
                <div className="p-4 rounded-xl bg-gray-50 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-caldera-text-secondary">Daily Limit</span>
                    <span className="text-sm font-medium text-caldera-black">
                      {formatSol(vault.dailyLimit)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-caldera-text-muted mb-2">
                    <span>Spent Today</span>
                    <span>{formatSol(vault.dailySpent)} / {formatSol(vault.dailyLimit)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-caldera-orange to-caldera-purple transition-all rounded-full"
                      style={{
                        width: `${Math.min((Number(vault.dailySpent) / Number(vault.dailyLimit)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl border-gray-200 hover:bg-gray-100 hover:border-caldera-orange/30"
                    onClick={() => window.location.href = `/vaults/${vault.id}`}
                  >
                    <Code2 className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-gray-200 hover:bg-gray-100 px-3"
                    onClick={() => handleOpenSettings(vault)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-gray-200 hover:bg-gray-100 px-3"
                    onClick={() => handlePauseToggle(vault)}
                    disabled={togglingVault === vault.id}
                    title={vault.isActive ? 'Pause vault' : 'Resume vault'}
                  >
                    {togglingVault === vault.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : vault.isActive ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
  );
}
