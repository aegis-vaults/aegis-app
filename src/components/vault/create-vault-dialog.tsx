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
import { Loader2, Plus } from 'lucide-react';
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
      // Generate agent signer if not provided
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
        // Generate a new keypair for the agent
        const agentKeypair = Keypair.generate();
        agentSignerPubkey = agentKeypair.publicKey;
        // TODO: Store this keypair securely or allow user to provide their own
        console.log('Generated agent signer:', agentSignerPubkey.toBase58());
        console.log('Agent signer secret (SAVE THIS):', Buffer.from(agentKeypair.secretKey).toString('base64'));
      }

      // Build transaction
      const { transaction, vault, vaultAuthority } = await instructions.initializeVault(
        wallet.adapter as any,
        agentSignerPubkey,
        BigInt(Math.floor(dailyLimitLamports)),
        formData.name
      );

      // Send transaction
      const connection = getConnection();

      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      
      // Add priority fees to ensure transaction lands quickly
      const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000, // 0.00005 SOL per compute unit - helps transaction land faster
      });
      const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200000,
      });
      
      // Prepend priority fee instructions
      transaction.instructions = [priorityFeeIx, computeLimitIx, ...transaction.instructions];
      
      // Set blockhash on transaction
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('Sending transaction to:', connection.rpcEndpoint);
      console.log('Vault PDA:', vault.toBase58());
      console.log('Fee payer:', publicKey.toBase58());
      console.log('Using blockhash:', blockhash);
      console.log('Last valid block height:', lastValidBlockHeight);

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'processed', // Use 'processed' for faster initial response
        maxRetries: 3,
      });

      console.log('Signature received:', signature);
      toast.loading('Confirming transaction...', { id: signature });

      // Wait for confirmation using the blockhash from before we sent
      let confirmed = false;
      try {
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          'confirmed'
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        confirmed = true;
        console.log('Transaction confirmed!');
      } catch (confirmError: any) {
        console.error('Confirmation error:', confirmError);
        // If confirmation times out or block height exceeded, provide helpful info
        if (
          confirmError.message?.includes('timeout') ||
          confirmError.message?.includes('not confirmed') ||
          confirmError.message?.includes('block height exceeded')
        ) {
          toast.warning(
            `Transaction sent but confirmation unclear. Check signature: ${signature.slice(0, 8)}...`,
            { id: signature, duration: 10000 }
          );
          console.log('Check transaction:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
        } else {
          throw confirmError;
        }
      }

      // CRITICAL: Verify the vault account actually exists on-chain
      console.log('Verifying vault account on-chain...');
      let vaultExists = false;
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const vaultInfo = await connection.getAccountInfo(vault);
        if (vaultInfo) {
          vaultExists = true;
          console.log('✅ Vault account verified on-chain, size:', vaultInfo.data.length);
          break;
        }
        console.log(`Vault verification attempt ${i + 1} - not found yet...`);
      }

      if (!vaultExists) {
        // Transaction didn't actually land on chain
        toast.error(
          'Transaction did not land on-chain. This may be an RPC issue. Please try again.',
          { id: signature, duration: 10000 }
        );
        throw new Error('Vault account not created on-chain despite signature');
      }

      toast.success(TOAST_MESSAGES.VAULT_CREATED, { id: signature });

      // Log vault details
      console.log('Vault created:', {
        vault: vault.toBase58(),
        vaultAuthority: vaultAuthority.toBase58(),
        signature,
      });

      // Link vault to user account
      // Wait a bit for the event listener to process the vault creation
      toast.loading('Linking vault to your account...', { id: 'link-vault' });

      let linkAttempts = 0;
      const maxLinkAttempts = 5;
      const linkRetryDelay = 2000; // 2 seconds

      // Ensure API client has the latest wallet address before linking
      apiClient.setUserId(publicKey.toString());

      let linked = false;
      while (linkAttempts < maxLinkAttempts && !linked) {
        try {
          await new Promise((resolve) => setTimeout(resolve, linkRetryDelay));
          await api.vaults.link(vault.toBase58(), formData.name);
          toast.success('Vault linked successfully', { id: 'link-vault' });
          linked = true;
        } catch (error: any) {
          linkAttempts++;
          console.log(`Link attempt ${linkAttempts} failed:`, error.message);
          // Continue retrying
        }
      }

      // If linking failed, try syncing directly from blockchain
      if (!linked) {
        toast.loading('Syncing vault from blockchain...', { id: 'link-vault' });
        try {
          await api.vaults.sync(vault.toBase58());
          toast.success('Vault synced and linked successfully', { id: 'link-vault' });
          linked = true;
        } catch (syncError: any) {
          console.error('Failed to sync vault:', syncError);
          toast.warning(
            'Vault created but linking failed. Try refreshing the page or manually syncing later.',
            { id: 'link-vault', duration: 5000 }
          );
        }
      }

      // Reset form and close dialog
      setFormData({ name: '', dailyLimit: '', agentSigner: '' });
      setOpen(false);

      // Call success callback
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
          <Button className="bg-aegis-blue hover:bg-aegis-blue/90">
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

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Vault Name <span className="text-aegis-crimson">*</span>
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
              <p className="text-xs text-aegis-text-tertiary">
                A friendly name for your vault (max 50 characters)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dailyLimit">
                Daily Spending Limit (SOL) <span className="text-aegis-crimson">*</span>
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
              <p className="text-xs text-aegis-text-tertiary">
                Maximum SOL that can be spent per day
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agentSigner">
                Agent Signer Public Key <span className="text-aegis-text-tertiary">(optional)</span>
              </Label>
              <Input
                id="agentSigner"
                placeholder="Leave empty to generate automatically"
                value={formData.agentSigner}
                onChange={(e) => setFormData({ ...formData, agentSigner: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-aegis-text-tertiary">
                The AI agent public key authorized to propose transactions
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-aegis-blue hover:bg-aegis-blue/90"
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
