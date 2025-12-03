'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { formatSol, formatAddress } from '@/lib/utils';
import { CONFIG } from '@/lib/constants';

interface VaultSettingsDialogProps {
  vault: {
    id: string;
    publicKey: string;
    name: string | null;
    owner: string;
    dailyLimit: string;
    dailySpent: string;
    isActive: boolean;
    whitelistEnabled: boolean;
    whitelist: string[];
    agentSigner?: string;
  };
  balance?: number; // SOL balance
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function VaultSettingsDialog({
  vault,
  balance,
  open,
  onOpenChange,
  onUpdate,
}: VaultSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(vault.name || '');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a vault name');
      return;
    }

    setLoading(true);
    try {
      await api.vaults.update(vault.id, { name: name.trim() });
      toast.success('Vault updated successfully');
      onOpenChange(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error updating vault:', error);
      toast.error(error.message || 'Failed to update vault');
    } finally {
      setLoading(false);
    }
  };

  const explorerUrl = `https://explorer.solana.com/address/${vault.publicKey}?cluster=${CONFIG.SOLANA_NETWORK}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-aegis-bg-secondary border-aegis-border">
        <DialogHeader>
          <DialogTitle className="text-aegis-text-primary">Vault Settings</DialogTitle>
          <DialogDescription className="text-aegis-text-secondary">
            Manage your vault configuration and view details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Vault Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-aegis-text-secondary">Vault Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My AI Agent Vault"
              className="bg-aegis-bg-tertiary border-aegis-border text-aegis-text-primary"
            />
          </div>

          {/* Vault Details */}
          <div className="space-y-3 p-4 rounded-lg bg-aegis-bg-tertiary">
            <h4 className="text-sm font-medium text-aegis-text-primary">Vault Details</h4>
            
            {/* Public Key */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-aegis-text-secondary">Address</span>
              <div className="flex items-center gap-2">
                <code className="text-xs text-aegis-text-primary font-mono">
                  {formatAddress(vault.publicKey)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(vault.publicKey, 'Address')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-aegis-blue hover:text-aegis-blue/80"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Balance */}
            {balance !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-aegis-text-secondary">Balance</span>
                <span className="text-sm font-medium text-aegis-emerald">
                  {balance.toFixed(4)} SOL
                </span>
              </div>
            )}

            {/* Daily Limit */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-aegis-text-secondary">Daily Limit</span>
              <span className="text-sm text-aegis-text-primary">
                {formatSol(vault.dailyLimit)} SOL
              </span>
            </div>

            {/* Spent Today */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-aegis-text-secondary">Spent Today</span>
              <span className="text-sm text-aegis-text-primary">
                {formatSol(vault.dailySpent)} SOL
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-aegis-text-secondary">Status</span>
              <span className={`text-sm font-medium ${vault.isActive ? 'text-aegis-emerald' : 'text-aegis-crimson'}`}>
                {vault.isActive ? 'Active' : 'Paused'}
              </span>
            </div>

            {/* Whitelist */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-aegis-text-secondary">Whitelist</span>
              <span className="text-sm text-aegis-text-primary">
                {vault.whitelistEnabled ? `${vault.whitelist?.length || 0} addresses` : 'Disabled'}
              </span>
            </div>

            {/* Agent Signer */}
            {vault.agentSigner && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-aegis-text-secondary">Agent Signer</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-aegis-text-primary font-mono">
                    {formatAddress(vault.agentSigner)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(vault.agentSigner!, 'Agent Signer')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-aegis-border text-aegis-text-secondary hover:text-aegis-text-primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-aegis-blue hover:bg-aegis-blue/90"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

