'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wallet, ArrowRight, CheckCircle } from 'lucide-react';
import { getConnection } from '@/lib/solana/config';
import { getVaultAuthorityPDA } from '@/lib/solana/program';
import { formatAddress, cn } from '@/lib/utils';

interface FundVaultDialogProps {
  vault: {
    publicKey: string;
    name: string | null;
  };
  currentBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = ['0.1', '0.5', '1', '5'];

export function FundVaultDialog({
  vault,
  currentBalance,
  open,
  onOpenChange,
  onSuccess,
}: FundVaultDialogProps) {
  const wallet = useWallet();
  const [amount, setAmount] = useState('0.5');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFund = async () => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    const fundAmount = parseFloat(amount);
    if (isNaN(fundAmount) || fundAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const connection = getConnection();
      const vaultPubkey = new PublicKey(vault.publicKey);
      const [vaultAuthority] = getVaultAuthorityPDA(vaultPubkey);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: vaultAuthority,
          lamports: Math.floor(fundAmount * LAMPORTS_PER_SOL),
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      setSuccess(true);
      toast.success(`Successfully funded vault with ${fundAmount} SOL`);
      
      if (onSuccess) {
        onSuccess();
      }

      // Close after short delay to show success state
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setAmount('0.5');
      }, 1500);
    } catch (error: any) {
      console.error('Error funding vault:', error);
      toast.error(error.message || 'Failed to fund vault');
    } finally {
      setLoading(false);
    }
  };

  const newBalance = currentBalance + (parseFloat(amount) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-caldera-success/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-caldera-success" />
            </div>
            <span>Fund Vault</span>
          </DialogTitle>
          <DialogDescription>
            Transfer SOL from your wallet to the vault&apos;s on-chain balance.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-caldera-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-caldera-success" />
            </div>
            <p className="text-lg font-display font-bold text-caldera-black">Transaction Successful!</p>
            <p className="text-sm text-caldera-text-muted mt-1">Your vault has been funded</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Vault Info */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-caldera-text-secondary">Vault</span>
                  <span className="text-sm font-medium text-caldera-black">
                    {vault.name || 'Unnamed Vault'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-caldera-text-secondary">Address</span>
                  <code className="text-xs font-mono text-caldera-text-muted">
                    {formatAddress(vault.publicKey)}
                  </code>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-caldera-text-secondary">
                  Amount (SOL)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg font-semibold"
                />
                <div className="flex gap-2 mt-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(preset)}
                      className={cn(
                        "flex-1 rounded-lg text-sm transition-all",
                        amount === preset && "border-caldera-orange bg-caldera-orange/5 text-caldera-orange"
                      )}
                    >
                      {preset} SOL
                    </Button>
                  ))}
                </div>
              </div>

              {/* Balance Preview */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-caldera-success/5 to-caldera-orange/5 border border-caldera-success/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-caldera-text-muted mb-1">Current Balance</p>
                    <p className="text-lg font-display font-bold text-caldera-black">
                      {currentBalance.toFixed(4)} SOL
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-caldera-text-muted" />
                  <div className="text-right">
                    <p className="text-xs text-caldera-text-muted mb-1">New Balance</p>
                    <p className="text-lg font-display font-bold text-caldera-success">
                      {isNaN(newBalance) ? currentBalance.toFixed(4) : newBalance.toFixed(4)} SOL
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFund}
                disabled={loading || !parseFloat(amount) || parseFloat(amount) <= 0}
                className="rounded-xl bg-caldera-success hover:bg-caldera-success/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Fund Vault
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

