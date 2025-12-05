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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Fuel, ArrowRight, CheckCircle, Info, Zap } from 'lucide-react';
import { getConnection } from '@/lib/solana/config';
import { formatAddress, cn } from '@/lib/utils';

interface FundAgentDialogProps {
  agentSigner: string;
  vaultName: string | null;
  currentBalance: number;
  estimatedTransactions: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = ['0.01', '0.05', '0.1', '0.5'];

// Estimated cost per transaction in SOL
const ESTIMATED_TX_COST = 0.000005;

export function FundAgentDialog({
  agentSigner,
  vaultName,
  currentBalance,
  estimatedTransactions,
  open,
  onOpenChange,
  onSuccess,
}: FundAgentDialogProps) {
  const wallet = useWallet();
  const [amount, setAmount] = useState('0.05');
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

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(agentSigner),
          lamports: Math.floor(fundAmount * LAMPORTS_PER_SOL),
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      setSuccess(true);
      toast.success(`Successfully funded agent with ${fundAmount} SOL`);
      
      if (onSuccess) {
        onSuccess();
      }

      // Close after short delay to show success state
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setAmount('0.05');
      }, 1500);
    } catch (error: any) {
      console.error('Error funding agent:', error);
      toast.error(error.message || 'Failed to fund agent');
    } finally {
      setLoading(false);
    }
  };

  const fundAmountNum = parseFloat(amount) || 0;
  const newBalance = currentBalance + fundAmountNum;
  const newEstimatedTxs = Math.floor(newBalance / ESTIMATED_TX_COST);
  const additionalTxs = Math.floor(fundAmountNum / ESTIMATED_TX_COST);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-caldera-orange/10 flex items-center justify-center">
              <Fuel className="w-5 h-5 text-caldera-orange" />
            </div>
            <span>Fund Agent Gas</span>
          </DialogTitle>
          <DialogDescription>
            Add SOL to your AI agent&apos;s wallet for transaction fees.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-caldera-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-caldera-success" />
            </div>
            <p className="text-lg font-display font-bold text-caldera-black">Agent Funded!</p>
            <p className="text-sm text-caldera-text-muted mt-1">Your agent is ready to transact</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Agent Info */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-caldera-text-secondary">Vault</span>
                  <span className="text-sm font-medium text-caldera-black">
                    {vaultName || 'Unnamed Vault'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-caldera-text-secondary">Agent Signer</span>
                  <code className="text-xs font-mono text-caldera-text-muted">
                    {formatAddress(agentSigner)}
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
                  step="0.001"
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
              <div className="p-4 rounded-xl bg-gradient-to-r from-caldera-orange/5 to-caldera-purple/5 border border-caldera-orange/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-caldera-text-muted mb-1">Current Balance</p>
                    <p className="text-lg font-display font-bold text-caldera-black">
                      {currentBalance.toFixed(6)} SOL
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-caldera-text-muted" />
                  <div className="text-right">
                    <p className="text-xs text-caldera-text-muted mb-1">New Balance</p>
                    <p className="text-lg font-display font-bold text-caldera-orange">
                      {isNaN(newBalance) ? currentBalance.toFixed(6) : newBalance.toFixed(6)} SOL
                    </p>
                  </div>
                </div>
                
                {/* Transaction Estimate */}
                <div className="pt-3 border-t border-caldera-orange/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-caldera-text-secondary flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Est. Transactions
                    </span>
                    <span className="font-semibold text-caldera-black">
                      {estimatedTransactions.toLocaleString()} → {newEstimatedTxs.toLocaleString()}
                      <span className="text-caldera-success ml-1">
                        (+{additionalTxs.toLocaleString()})
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <Alert className="border-caldera-purple/20 bg-caldera-purple/5">
                <Info className="h-4 w-4 text-caldera-purple" />
                <AlertDescription className="text-sm text-caldera-text-secondary">
                  Agent gas is used for transaction fees when your AI executes transfers. 
                  A small amount goes a long way—0.05 SOL covers ~10,000 transactions.
                </AlertDescription>
              </Alert>
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
                className="rounded-xl bg-caldera-orange hover:bg-caldera-orange/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Fuel className="w-4 h-4 mr-2" />
                    Fund Agent
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

