'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, Copy, ExternalLink, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { instructions } from '@/lib/solana/instructions';
import { formatSol, formatAddress } from '@/lib/utils';
import { CONFIG } from '@/lib/constants';
import { getConnection } from '@/lib/solana/config';

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
    vaultNonce?: string; // BigInt as string - nonce used for PDA derivation
  };
  balance?: number;
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
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General tab state
  const [name, setName] = useState(vault.name || '');

  // Policy tab state
  const [dailyLimit, setDailyLimit] = useState(
    (Number(vault.dailyLimit) / LAMPORTS_PER_SOL).toString()
  );
  const [isPaused, setIsPaused] = useState(!vault.isActive);

  // Whitelist tab state
  const [whitelistAddress, setWhitelistAddress] = useState('');
  const [whitelist, setWhitelist] = useState<string[]>(vault.whitelist || []);

  // Agent tab state
  const [newAgentSigner, setNewAgentSigner] = useState('');

  // Team tab state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Sync vault from blockchain to get correct vaultNonce
  const handleSyncVault = async () => {
    setSyncing(true);
    try {
      await api.vaults.sync(vault.publicKey);
      toast.success('Vault synced from blockchain! Please close and reopen settings.');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error syncing vault:', error);
      toast.error(error.message || 'Failed to sync vault');
    } finally {
      setSyncing(false);
    }
  };

  // Load team members when dialog opens or tab changes to team
  useEffect(() => {
    if (open && activeTab === 'team') {
      loadTeamMembers();
    }
  }, [open, activeTab]);

  const loadTeamMembers = async () => {
    setLoadingTeam(true);
    try {
      const response = await api.vaults.team.list(vault.id);
      setTeamMembers(response.data || []);
    } catch (error: any) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error('Please enter a vault name');
      return;
    }

    setLoading(true);
    try {
      await api.vaults.update(vault.id, { name: name.trim() });
      toast.success('Vault name updated successfully');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error updating vault name:', error);
      toast.error(error.message || 'Failed to update vault name');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDailyLimit = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    const limitValue = parseFloat(dailyLimit);
    if (isNaN(limitValue) || limitValue <= 0) {
      toast.error('Please enter a valid daily limit');
      return;
    }

    setLoading(true);
    try {
      const connection: Connection = getConnection();
      const vaultPubkey = new PublicKey(vault.publicKey);
      const newLimitLamports = BigInt(Math.floor(limitValue * LAMPORTS_PER_SOL));

      const vaultNonce = BigInt(vault.vaultNonce || '0');
      const { transaction } = await instructions.updateDailyLimit(
        wallet as any,
        vaultPubkey,
        newLimitLamports,
        vaultNonce
      );

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      // Update backend
      await api.vaults.update(vault.id, {
        dailyLimit: newLimitLamports.toString(),
      });

      toast.success('Daily limit updated successfully');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error updating daily limit:', error);
      toast.error(error.message || 'Failed to update daily limit');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
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

      // Update backend
      await api.vaults.update(vault.id, {
        paused: !isPaused,
      });

      setIsPaused(!isPaused);
      toast.success(`Vault ${isPaused ? 'resumed' : 'paused'} successfully`);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error toggling vault pause:', error);
      toast.error(error.message || 'Failed to toggle vault pause');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWhitelist = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!whitelistAddress.trim()) {
      toast.error('Please enter an address');
      return;
    }

    try {
      const addressPubkey = new PublicKey(whitelistAddress);

      if (whitelist.includes(addressPubkey.toString())) {
        toast.error('Address already in whitelist');
        return;
      }

      setLoading(true);

      const connection: Connection = getConnection();
      const vaultPubkey = new PublicKey(vault.publicKey);
      const vaultNonce = BigInt(vault.vaultNonce || '0');

      const { transaction } = await instructions.addToWhitelist(
        wallet as any,
        vaultPubkey,
        addressPubkey,
        vaultNonce
      );

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      // Update local state and backend
      const newWhitelist = [...whitelist, addressPubkey.toString()];
      setWhitelist(newWhitelist);
      await api.vaults.update(vault.id, {
        whitelist: newWhitelist,
      });

      setWhitelistAddress('');
      toast.success('Address added to whitelist');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error adding to whitelist:', error);
      toast.error(error.message || 'Failed to add to whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWhitelist = async (address: string) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    try {
      const connection: Connection = getConnection();
      const vaultPubkey = new PublicKey(vault.publicKey);
      const addressPubkey = new PublicKey(address);
      const vaultNonce = BigInt(vault.vaultNonce || '0');

      const { transaction } = await instructions.removeFromWhitelist(
        wallet as any,
        vaultPubkey,
        addressPubkey,
        vaultNonce
      );

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      // Update local state and backend
      const newWhitelist = whitelist.filter((addr) => addr !== address);
      setWhitelist(newWhitelist);
      await api.vaults.update(vault.id, {
        whitelist: newWhitelist,
      });

      toast.success('Address removed from whitelist');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error removing from whitelist:', error);
      toast.error(error.message || 'Failed to remove from whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAgentSigner = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!newAgentSigner.trim()) {
      toast.error('Please enter a new agent signer address');
      return;
    }

    try {
      const agentSignerPubkey = new PublicKey(newAgentSigner);

      setLoading(true);

      const connection: Connection = getConnection();
      const vaultPubkey = new PublicKey(vault.publicKey);
      const vaultNonce = BigInt(vault.vaultNonce || '0');

      const { transaction } = await instructions.updateAgentSigner(
        wallet as any,
        vaultPubkey,
        agentSignerPubkey,
        vaultNonce
      );

      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Agent signer updated successfully');
      setNewAgentSigner('');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error updating agent signer:', error);
      toast.error(error.message || 'Failed to update agent signer');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!newMemberAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    setLoadingTeam(true);
    try {
      await api.vaults.team.add(vault.id, {
        userWalletAddress: newMemberAddress,
        role: newMemberRole,
      });

      toast.success('Team member added successfully');
      setNewMemberAddress('');
      setNewMemberRole('MEMBER');
      await loadTeamMembers();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast.error(error.message || 'Failed to add team member');
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    setLoadingTeam(true);
    try {
      await api.vaults.team.updateRole(vault.id, memberId, newRole as any);

      toast.success('Team member role updated');
      await loadTeamMembers();
    } catch (error: any) {
      console.error('Error updating team member:', error);
      toast.error(error.message || 'Failed to update team member');
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    setLoadingTeam(true);
    try {
      await api.vaults.team.remove(vault.id, memberId);

      toast.success('Team member removed successfully');
      await loadTeamMembers();
    } catch (error: any) {
      console.error('Error removing team member:', error);
      toast.error(error.message || 'Failed to remove team member');
    } finally {
      setLoadingTeam(false);
    }
  };

  const explorerUrl = `https://explorer.solana.com/address/${vault.publicKey}?cluster=${CONFIG.SOLANA_NETWORK}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-aegis-bg-secondary border-aegis-border">
        <DialogHeader>
          <DialogTitle className="text-aegis-text-primary">Vault Settings</DialogTitle>
          <DialogDescription className="text-aegis-text-secondary">
            Manage your vault configuration and policies.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-aegis-bg-tertiary">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="policy">Policy</TabsTrigger>
            <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 mt-4">
            {/* Vault Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-aegis-text-secondary">
                Vault Name
              </Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My AI Agent Vault"
                  className="bg-aegis-bg-tertiary border-aegis-border text-aegis-text-primary"
                />
                <Button
                  onClick={handleSaveName}
                  disabled={loading || name === vault.name}
                  className="bg-aegis-blue hover:bg-aegis-blue/90"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
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

              {/* Owner */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-aegis-text-secondary">Owner</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-aegis-text-primary font-mono">
                    {formatAddress(vault.owner)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(vault.owner, 'Owner')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Vault Nonce */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-aegis-text-secondary">Vault Nonce</span>
                <span className="text-xs font-mono text-aegis-text-tertiary">
                  {vault.vaultNonce || '0'}
                </span>
              </div>
            </div>

            {/* Sync from Blockchain */}
            <div className="p-4 rounded-lg bg-aegis-blue/10 border border-aegis-blue/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-aegis-blue">Sync from Blockchain</h4>
                  <p className="text-xs text-aegis-text-tertiary mt-1">
                    Update vault data from on-chain state (fixes nonce mismatch errors)
                  </p>
                </div>
                <Button
                  onClick={handleSyncVault}
                  disabled={syncing}
                  variant="outline"
                  className="border-aegis-blue text-aegis-blue hover:bg-aegis-blue/20"
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Policy Tab */}
          <TabsContent value="policy" className="space-y-4 mt-4">
            {/* Daily Limit */}
            <div className="space-y-2">
              <Label htmlFor="dailyLimit" className="text-aegis-text-secondary">
                Daily Spending Limit (SOL)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="dailyLimit"
                  type="number"
                  step="0.01"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  placeholder="0.00"
                  className="bg-aegis-bg-tertiary border-aegis-border text-aegis-text-primary"
                />
                <Button
                  onClick={handleUpdateDailyLimit}
                  disabled={
                    loading ||
                    dailyLimit === (Number(vault.dailyLimit) / LAMPORTS_PER_SOL).toString()
                  }
                  className="bg-aegis-blue hover:bg-aegis-blue/90"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-aegis-text-secondary">
                Current: {formatSol(vault.dailyLimit)} SOL | Spent today: {formatSol(vault.dailySpent)}{' '}
                SOL
              </p>
            </div>

            {/* Pause/Resume Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-aegis-bg-tertiary">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-aegis-text-primary">Vault Status</Label>
                <p className="text-xs text-aegis-text-secondary">
                  {isPaused ? 'Vault is paused. All transactions are blocked.' : 'Vault is active.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    isPaused ? 'text-aegis-crimson' : 'text-aegis-emerald'
                  }`}
                >
                  {isPaused ? 'Paused' : 'Active'}
                </span>
                <Switch
                  checked={!isPaused}
                  onCheckedChange={handleTogglePause}
                  disabled={loading}
                />
              </div>
            </div>
          </TabsContent>

          {/* Whitelist Tab */}
          <TabsContent value="whitelist" className="space-y-4 mt-4">
            {/* Add Address */}
            <div className="space-y-2">
              <Label htmlFor="whitelistAddress" className="text-aegis-text-secondary">
                Add Address to Whitelist
              </Label>
              <div className="flex gap-2">
                <Input
                  id="whitelistAddress"
                  value={whitelistAddress}
                  onChange={(e) => setWhitelistAddress(e.target.value)}
                  placeholder="Enter Solana address"
                  className="bg-aegis-bg-tertiary border-aegis-border text-aegis-text-primary"
                />
                <Button
                  onClick={handleAddToWhitelist}
                  disabled={loading || !whitelistAddress.trim()}
                  className="bg-aegis-blue hover:bg-aegis-blue/90"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-aegis-text-secondary">
                Maximum 20 addresses. Only whitelisted addresses can receive transactions.
              </p>
            </div>

            {/* Whitelist */}
            <div className="space-y-2">
              <Label className="text-aegis-text-secondary">
                Whitelisted Addresses ({whitelist.length}/20)
              </Label>
              {whitelist.length === 0 ? (
                <div className="text-sm text-aegis-text-secondary p-4 rounded-lg bg-aegis-bg-tertiary text-center">
                  No addresses in whitelist
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {whitelist.map((address) => (
                    <div
                      key={address}
                      className="flex items-center justify-between p-3 rounded-lg bg-aegis-bg-tertiary"
                    >
                      <code className="text-xs text-aegis-text-primary font-mono">
                        {formatAddress(address)}
                      </code>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(address, 'Address')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-aegis-crimson hover:text-aegis-crimson/80"
                          onClick={() => handleRemoveFromWhitelist(address)}
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Agent Tab */}
          <TabsContent value="agent" className="space-y-4 mt-4">
            {/* Current Agent Signer */}
            <div className="space-y-2">
              <Label className="text-aegis-text-secondary">Current Agent Signer</Label>
              <div className="p-3 rounded-lg bg-aegis-bg-tertiary">
                {vault.agentSigner ? (
                  <div className="flex items-center justify-between">
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
                ) : (
                  <p className="text-sm text-aegis-text-secondary">No agent signer configured</p>
                )}
              </div>
            </div>

            {/* Update Agent Signer */}
            <div className="space-y-2">
              <Label htmlFor="newAgentSigner" className="text-aegis-text-secondary">
                Update Agent Signer
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newAgentSigner"
                  value={newAgentSigner}
                  onChange={(e) => setNewAgentSigner(e.target.value)}
                  placeholder="Enter new agent signer address"
                  className="bg-aegis-bg-tertiary border-aegis-border text-aegis-text-primary"
                />
                <Button
                  onClick={handleUpdateAgentSigner}
                  disabled={loading || !newAgentSigner.trim()}
                  className="bg-aegis-blue hover:bg-aegis-blue/90"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-aegis-text-secondary">
                The agent signer is the AI&apos;s key that can propose transactions. Change this to rotate the
                agent&apos;s credentials.
              </p>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4 mt-4">
            {/* Add Team Member */}
            <div className="space-y-2">
              <Label className="text-aegis-text-secondary">Add Team Member</Label>
              <div className="flex gap-2">
                <Input
                  value={newMemberAddress}
                  onChange={(e) => setNewMemberAddress(e.target.value)}
                  placeholder="Enter wallet address"
                  className="flex-1 bg-aegis-bg-tertiary border-aegis-border text-aegis-text-primary"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="px-3 py-2 rounded-md bg-aegis-bg-tertiary border border-aegis-border text-aegis-text-primary"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="OWNER">Owner</option>
                </select>
                <Button
                  onClick={handleAddTeamMember}
                  disabled={loadingTeam || !newMemberAddress.trim()}
                  className="bg-aegis-blue hover:bg-aegis-blue/90"
                >
                  {loadingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-aegis-text-secondary">
                Team members can view vault activity. Admins can modify settings.
              </p>
            </div>

            {/* Team Members List */}
            <div className="space-y-2">
              <Label className="text-aegis-text-secondary">
                Team Members ({teamMembers.length})
              </Label>
              {loadingTeam && teamMembers.length === 0 ? (
                <div className="text-sm text-aegis-text-secondary p-4 rounded-lg bg-aegis-bg-tertiary text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-sm text-aegis-text-secondary p-4 rounded-lg bg-aegis-bg-tertiary text-center">
                  No team members yet
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-aegis-bg-tertiary"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-aegis-text-primary font-mono">
                            {formatAddress(member.user.walletAddress)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleCopy(member.user.walletAddress, 'Wallet Address')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {member.user.email && (
                          <p className="text-xs text-aegis-text-secondary mt-1">{member.user.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                          disabled={loadingTeam}
                          className="px-2 py-1 text-sm rounded-md bg-aegis-bg-secondary border border-aegis-border text-aegis-text-primary"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                          <option value="VIEWER">Viewer</option>
                          <option value="OWNER">Owner</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-aegis-crimson hover:text-aegis-crimson/80"
                          onClick={() => handleRemoveTeamMember(member.id)}
                          disabled={loadingTeam}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role Descriptions */}
            <div className="p-3 rounded-lg bg-aegis-bg-tertiary">
              <h4 className="text-sm font-medium text-aegis-text-primary mb-2">Role Permissions</h4>
              <div className="space-y-1 text-xs text-aegis-text-secondary">
                <p><strong>Owner:</strong> Full control over vault and team</p>
                <p><strong>Admin:</strong> Can modify policies and manage team members</p>
                <p><strong>Member:</strong> Can view vault activity and approve overrides</p>
                <p><strong>Viewer:</strong> Read-only access to vault information</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
