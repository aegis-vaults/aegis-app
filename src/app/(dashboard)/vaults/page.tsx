'use client';

import { useVaults } from '@/lib/hooks/use-vaults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatSol, formatAddress } from '@/lib/utils';
import { Plus, Vault as VaultIcon, Settings, Pause, Play } from 'lucide-react';
import { CreateVaultDialog } from '@/components/vault/create-vault-dialog';

export default function VaultsPage() {
  const { data, isLoading, refetch } = useVaults({ myVaults: true });
  const vaults = data?.data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-aegis-text-primary">Vaults</h1>
          <p className="text-aegis-text-secondary mt-1">Manage your AI agent vaults</p>
        </div>
        <CreateVaultDialog onSuccess={() => refetch()} />
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
            <Card key={vault.id} className="glass-card hover:border-aegis-blue/50 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {vault.name || 'Unnamed Vault'}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {formatAddress(vault.publicKey)}
                    </CardDescription>
                  </div>
                  <Badge variant={vault.paused ? 'outline' : 'default'}>
                    {vault.paused ? 'Paused' : 'Active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Balance */}
                <div>
                  <div className="text-2xl font-bold text-aegis-text-primary">
                    {formatSol(vault.dailyLimit)} SOL
                  </div>
                  <div className="text-sm text-aegis-text-tertiary">Daily Limit</div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-aegis-text-secondary mb-1">
                    <span>Spent Today</span>
                    <span>{formatSol(vault.dailySpent)} / {formatSol(vault.dailyLimit)}</span>
                  </div>
                  <div className="h-2 bg-aegis-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-aegis-emerald to-aegis-blue transition-all"
                      style={{
                        width: `${Math.min((Number(vault.dailySpent) / Number(vault.dailyLimit)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Settings className="w-3 h-3 mr-1" />
                    Settings
                  </Button>
                  <Button size="sm" variant="outline">
                    {vault.paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
