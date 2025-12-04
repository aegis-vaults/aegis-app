'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair, ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { instructions } from '@/lib/solana/instructions';
import { getConnection } from '@/lib/solana/config';
import { LAMPORTS_PER_SOL, TOAST_MESSAGES } from '@/lib/constants';
import { Loader2, Plus, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import apiClient from '@/lib/api/client';

interface CreateVaultDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateVaultDialog({ onSuccess, trigger }: CreateVaultDialogProps) {
  const { publicKey, sendTransaction, wallet } = useWallet();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dailyLimit: '',
    agentSigner: '',
  });
  const [generatedKeypair, setGeneratedKeypair] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleGenerateKeypair = () => {
    const keypair = Keypair.generate();
    const generated = {
      publicKey: keypair.publicKey.toBase58(),
      secretKey: JSON.stringify(Array.from(keypair.secretKey)),
    };
    setGeneratedKeypair(generated);
    setFormData({ ...formData, agentSigner: generated.publicKey });
    toast.success('Agent keypair generated! Make sure to save the secret key.');
  };

  const copySecretKey = async () => {
    if (!generatedKeypair) return;
    try {
      await navigator.clipboard.writeText(generatedKeypair.secretKey);
      setCopiedSecret(true);
      toast.success('Secret key copied to clipboard');
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (error) {
      toast.error('Failed to copy secret key');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey || !wallet) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!formData.name || !formData.dailyLimit) {
      toast.error('Please fill in all required fields');
      return;
    }

    const dailyLimitLamports = parseFloat(formData.dailyLimit) * LAMPORTS_PER_SOL;
    if (isNaN(dailyLimitLamports) || dailyLimitLamports <= 0) {
      toast.error('Please enter a valid daily limit');
      return;
    }

    setLoading(true);

    try {
      let agentSignerPubkey: PublicKey;
      if (formData.agentSigner.trim()) {
        try {
          agentSignerPubkey = new PublicKey(formData.agentSigner.trim());
        } catch {
          toast.error('Invalid agent signer public key');
          setLoading(false);
          return;
        }
      } else {
        if (!generatedKeypair) {
          toast.error('Please generate or provide an agent signer public key');
          setLoading(false);
          return;
        }
        agentSignerPubkey = new PublicKey(generatedKeypair.publicKey);
      }

      const connection = getConnection();

      const { transaction, vault, vaultAuthority, nonce } = await instructions.initializeVault(
        wallet.adapter as any,
        agentSignerPubkey,
        BigInt(Math.floor(dailyLimitLamports)),
        formData.name
      );

      console.log('Creating vault with nonce:', nonce?.toString());

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      
      const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000,
      });
      const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200000,
      });
      
      transaction.instructions = [priorityFeeIx, computeLimitIx, ...transaction.instructions];
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'processed',
        maxRetries: 3,
      });

      toast.loading('Confirming transaction...', { id: signature });

      let confirmed = false;
      try {
        const confirmation = await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          'confirmed'
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        confirmed = true;
      } catch (confirmError: any) {
        if (
          confirmError.message?.includes('timeout') ||
          confirmError.message?.includes('not confirmed') ||
          confirmError.message?.includes('block height exceeded')
        ) {
          toast.warning(
            `Transaction sent but confirmation unclear. Check signature: ${signature.slice(0, 8)}...`,
            { id: signature, duration: 10000 }
          );
        } else {
          throw confirmError;
        }
      }

      let vaultExists = false;
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const vaultInfo = await connection.getAccountInfo(vault);
        if (vaultInfo) {
          vaultExists = true;
          break;
        }
      }

      if (!vaultExists) {
        toast.error('Transaction did not land on-chain. Please try again.', { id: signature, duration: 10000 });
        throw new Error('Vault account not created on-chain despite signature');
      }

      toast.success(TOAST_MESSAGES.VAULT_CREATED, { id: signature });
      toast.loading('Linking vault to your account...', { id: 'link-vault' });

      apiClient.setUserId(publicKey.toString());

      let linked = false;
      let linkAttempts = 0;
      while (linkAttempts < 5 && !linked) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await api.vaults.link(vault.toBase58(), formData.name);
          toast.success('Vault linked successfully', { id: 'link-vault' });
          linked = true;
        } catch (error: any) {
          linkAttempts++;
        }
      }

      if (!linked) {
        try {
          await api.vaults.sync(vault.toBase58());
          toast.success('Vault synced and linked successfully', { id: 'link-vault' });
        } catch (syncError: any) {
          toast.warning('Vault created but linking failed. Try refreshing.', { id: 'link-vault', duration: 5000 });
        }
      }

      setFormData({ name: '', dailyLimit: '', agentSigner: '' });
      setGeneratedKeypair(null);
      setCopiedSecret(false);
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating vault:', error);
      toast.error(error.message || 'Failed to create vault');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-caldera-orange hover:bg-caldera-orange-secondary rounded-xl shadow-md shadow-caldera-orange/20">
            <Plus className="w-4 h-4 mr-2" />
            Create Vault
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Vault</DialogTitle>
            <DialogDescription>
              Create a new Aegis vault to manage AI agent transactions with programmable guardrails.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-caldera-black font-medium">
                Vault Name <span className="text-caldera-orange">*</span>
              </Label>
              <Input
                id="name"
                placeholder="My AI Trading Vault"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={50}
                disabled={loading}
                required
              />
              <p className="text-xs text-caldera-text-muted">
                A friendly name for your vault (max 50 characters)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dailyLimit" className="text-caldera-black font-medium">
                Daily Spending Limit (SOL) <span className="text-caldera-orange">*</span>
              </Label>
              <Input
                id="dailyLimit"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1.0"
                value={formData.dailyLimit}
                onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                disabled={loading}
                required
              />
              <p className="text-xs text-caldera-text-muted">
                Maximum SOL that can be spent per day
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agentSigner" className="text-caldera-black font-medium">
                Agent Signer Public Key <span className="text-caldera-orange">*</span>
              </Label>

              {!generatedKeypair ? (
                <div className="space-y-3">
                  <Alert className="border-caldera-info/30 bg-caldera-info/5 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-caldera-info" />
                    <AlertDescription className="text-xs text-caldera-text-secondary">
                      Your AI agent needs a keypair to interact with this vault. You can generate one now or provide an existing public key.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateKeypair}
                      disabled={loading}
                      className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Keypair
                    </Button>
                    <span className="text-xs text-caldera-text-muted self-center px-2">or</span>
                    <Input
                      id="agentSigner"
                      placeholder="Paste existing public key"
                      value={formData.agentSigner}
                      onChange={(e) => setFormData({ ...formData, agentSigner: e.target.value })}
                      disabled={loading}
                      className="flex-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-caldera-success/10 border border-caldera-success/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-caldera-success" />
                      <span className="text-sm font-semibold text-caldera-success">Keypair Generated</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-caldera-text-muted mb-1">Public Key:</p>
                        <code className="text-xs font-mono text-caldera-black block break-all bg-white/60 p-2 rounded-lg">
                          {generatedKeypair.publicKey}
                        </code>
                      </div>

                      <div>
                        <p className="text-xs text-caldera-text-muted mb-1">Secret Key (Save this securely!):</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-caldera-black block break-all flex-1 bg-white/60 p-2 rounded-lg">
                            {generatedKeypair.secretKey.substring(0, 50)}...
                          </code>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copySecretKey}
                            className="flex-shrink-0 rounded-lg"
                          >
                            {copiedSecret ? (
                              <Check className="w-3 h-3 text-caldera-success" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-red-200 bg-red-50 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <AlertDescription className="text-xs text-caldera-text-secondary">
                      <strong className="text-red-600">Important:</strong> Copy and save the secret key securely. You&apos;ll need it to configure your AI agent. This will not be shown again.
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setGeneratedKeypair(null);
                      setFormData({ ...formData, agentSigner: '' });
                    }}
                    disabled={loading}
                    className="text-xs text-caldera-text-muted hover:text-caldera-text-primary"
                  >
                    Generate Different Keypair
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-xl border-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-caldera-orange hover:bg-caldera-orange-secondary rounded-xl"
              disabled={loading || !publicKey}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Vault'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
