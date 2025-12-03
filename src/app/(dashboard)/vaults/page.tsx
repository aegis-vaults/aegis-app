'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useVaults } from '@/lib/hooks/use-vaults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatSol, formatAddress } from '@/lib/utils';
import { Plus, Vault as VaultIcon, Settings, Pause, Play, Wallet, RefreshCw, Code2 } from 'lucide-react';
import { CreateVaultDialog } from '@/components/vault/create-vault-dialog';
import { VaultSettingsDialog } from '@/components/vault/vault-settings-dialog';
import { getConnection } from '@/lib/solana/config';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getVaultAuthorityPDA } from '@/lib/solana/program';

export default function VaultsPage() {
  const { publicKey } = useWallet();
  const { data, isLoading, refetch } = useVaults({ myVaults: true });
  const vaults = data?.data?.items || [];
  
  // Track balances for each vault
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  
  // Settings dialog state
  const [selectedVault, setSelectedVault] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Fetch vault balances
  const fetchBalances = async () => {
    if (vaults.length === 0) return;
    
    setLoadingBalances(true);
    const connection = getConnection();
    const newBalances: Record<string, number> = {};
    
    for (const vault of vaults) {
      try {
        // Get the vault authority PDA which holds the actual funds
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

  // Fetch balances when vaults change
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
    try {
      // This would call the on-chain pause/resume instruction
      toast.info('Pause/Resume feature coming soon');
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle vault status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-aegis-text-primary">Vaults</h1>
          <p className="text-aegis-text-secondary mt-1">Manage your AI agent vaults</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              refetch();
              fetchBalances();
            }}
            disabled={loadingBalances}
            className="border-aegis-border"
          >
            <RefreshCw className={`w-4 h-4 ${loadingBalances ? 'animate-spin' : ''}`} />
          </Button>
          <CreateVaultDialog onSuccess={() => refetch()} />
        </div>
      </div>

      {/* Vaults Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-aegis-blue border-t-transparent"></div>
        </div>
      ) : vaults.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <VaultIcon className="w-12 h-12 text-aegis-text-tertiary mb-4" />
            <h3 className="text-lg font-medium text-aegis-text-primary mb-2">No vaults yet</h3>
            <p className="text-aegis-text-secondary text-center mb-6 max-w-md">
              Create your first vault to start managing AI agent transactions with programmable guardrails.
            </p>
            <CreateVaultDialog onSuccess={() => refetch()} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault) => (
            <Card key={vault.id} className="glass-card hover:border-aegis-blue/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {vault.name || 'Unnamed Vault'}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {formatAddress(vault.publicKey)}
                    </CardDescription>
                    {vault.agentSigner && (
                      <CardDescription className="font-mono text-xs mt-1 text-aegis-blue">
                        Agent: {formatAddress(vault.agentSigner)}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={vault.isActive ? 'default' : 'outline'}>
                    {vault.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Balance */}
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-aegis-emerald" />
                  <div>
                    <div className="text-2xl font-bold text-aegis-text-primary">
                      {loadingBalances ? (
                        <span className="text-aegis-text-tertiary">Loading...</span>
                      ) : (
                        <span className="text-aegis-emerald">
                          {(balances[vault.publicKey] || 0).toFixed(4)} SOL
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-aegis-text-tertiary">Vault Balance</div>
                  </div>
                </div>

                {/* Daily Limit */}
                <div className="p-3 rounded-lg bg-aegis-bg-tertiary/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-aegis-text-secondary">Daily Limit</span>
                    <span className="text-sm font-medium text-aegis-text-primary">
                      {formatSol(vault.dailyLimit)} SOL
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="flex justify-between text-xs text-aegis-text-tertiary mb-1">
                    <span>Spent Today</span>
                    <span>{formatSol(vault.dailySpent)} / {formatSol(vault.dailyLimit)}</span>
                  </div>
                  <div className="h-2 bg-aegis-bg-primary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-aegis-emerald to-aegis-blue transition-all"
                      style={{
                        width: `${Math.min((Number(vault.dailySpent) / Number(vault.dailyLimit)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Quick Actions - Always visible */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-aegis-border"
                    onClick={() => window.location.href = `/vaults/${vault.id}`}
                  >
                    <Code2 className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-aegis-border"
                    onClick={() => handleOpenSettings(vault)}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-aegis-border"
                    onClick={() => handlePauseToggle(vault)}
                  >
                    {vault.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
