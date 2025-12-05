'use client';

/**
 * Aegis Override Approval Page
 * 
 * Self-hosted replacement for dial.to Blinks.
 * Allows vault owners to approve blocked transaction overrides directly
 * without external dependencies or timeout issues.
 * 
 * URL format: /override?vault=...&destination=...&amount=...&reason=...
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/shared/wallet-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Wallet,
  ArrowRight,
  Clock,
  DollarSign,
  MapPin,
  Info
} from 'lucide-react';
import { formatSol, formatAddress, getExplorerUrl } from '@/lib/utils';
import { useOverrideTransaction, OverrideStatus } from '@/lib/hooks/use-override-transaction';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Block reason display mapping
const REASON_DISPLAY: Record<string, { label: string; description: string; color: string }> = {
  exceeded_daily_limit: {
    label: 'Daily Limit Exceeded',
    description: 'This transaction exceeds your vault\'s daily spending limit.',
    color: 'bg-caldera-yellow/20 text-yellow-700 border-caldera-yellow/30',
  },
  not_whitelisted: {
    label: 'Not Whitelisted',
    description: 'The destination address is not in your vault\'s whitelist.',
    color: 'bg-red-100 text-red-600 border-red-200',
  },
  vault_paused: {
    label: 'Vault Paused',
    description: 'Your vault is currently paused and not accepting transactions.',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  insufficient_funds: {
    label: 'Insufficient Funds',
    description: 'The vault does not have enough balance for this transaction.',
    color: 'bg-red-100 text-red-600 border-red-200',
  },
};

function OverridePageContent() {
  const searchParams = useSearchParams();
  const { connected, publicKey } = useWallet();

  // Parse URL parameters
  const vault = searchParams.get('vault') || '';
  const destination = searchParams.get('destination') || '';
  const amount = searchParams.get('amount') || '0';
  const reason = searchParams.get('reason') || 'exceeded_daily_limit';

  // Get override transaction hook
  const {
    status,
    error,
    signature,
    executeOverride,
    reset,
  } = useOverrideTransaction({
    vault,
    destination,
    amount,
    reason,
  });

  // Validate parameters
  const isValidParams = vault && destination && amount && Number(amount) > 0;

  // Get reason display info
  const reasonInfo = REASON_DISPLAY[reason] || REASON_DISPLAY.exceeded_daily_limit;
  const amountSol = formatSol(amount);

  // Handle approve click
  const handleApprove = async () => {
    if (!connected || !publicKey) return;
    await executeOverride();
  };

  // Render different states
  const renderContent = () => {
    if (!isValidParams) {
      return (
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-caldera-dark-gray mb-2">Invalid Override Request</h2>
          <p className="text-gray-600">
            The override link is missing required parameters.
            <br />
            Please use a valid override link from your notification.
          </p>
        </div>
      );
    }

    if (status === OverrideStatus.SUCCESS) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-caldera-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-caldera-success" />
          </div>
          <h2 className="text-2xl font-semibold text-caldera-dark-gray mb-2">Override Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your transaction has been approved and executed.
          </p>
          {signature && (
            <a
              href={getExplorerUrl('tx', signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-caldera-orange hover:text-caldera-orange-secondary transition-colors"
            >
              View on Explorer
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <div className="mt-8">
            <Link href="/dashboard">
              <Button className="bg-caldera-orange hover:bg-caldera-orange-secondary">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    if (status === OverrideStatus.ERROR) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-caldera-dark-gray mb-2">Override Failed</h2>
          <p className="text-gray-600 mb-4">
            {error || 'An error occurred while processing the override.'}
          </p>
          <Button onClick={reset} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-100">
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <>
        {/* Override Details */}
        <div className="space-y-6">
          {/* Reason Badge */}
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-caldera-yellow" />
            <Badge className={reasonInfo.color}>
              {reasonInfo.label}
            </Badge>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4 bg-gray-50 rounded-xl p-6 border border-gray-100">
            {/* Amount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>Amount</span>
              </div>
              <span className="text-xl font-semibold text-caldera-dark-gray">
                {amountSol} SOL
              </span>
            </div>

            {/* Destination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Destination</span>
              </div>
              <a
                href={getExplorerUrl('address', destination)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-caldera-orange hover:text-caldera-orange-secondary transition-colors flex items-center gap-1"
              >
                {formatAddress(destination, 6)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Vault */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Vault</span>
              </div>
              <a
                href={getExplorerUrl('address', vault)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-caldera-orange hover:text-caldera-orange-secondary transition-colors flex items-center gap-1"
              >
                {formatAddress(vault, 6)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Reason Description */}
          <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
            <Info className="w-5 h-5 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-600">
              {reasonInfo.description}
            </p>
          </div>

          {/* Wallet Connection & Action */}
          <div className="space-y-4 pt-4">
            {!connected ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Wallet className="w-5 h-5" />
                  <span>Connect your wallet to approve this override</span>
                </div>
                <WalletButton variant="hero" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Connected Wallet Info */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <div className="w-2 h-2 rounded-full bg-caldera-success" />
                    Connected
                  </div>
                  <span className="font-mono text-caldera-dark-gray text-sm">
                    {publicKey && formatAddress(publicKey.toBase58(), 4)}
                  </span>
                </div>

                {/* Approve Button */}
                <Button
                  onClick={handleApprove}
                  disabled={status === OverrideStatus.BUILDING || status === OverrideStatus.SIGNING || status === OverrideStatus.CONFIRMING}
                  className={cn(
                    "w-full py-6 text-lg font-semibold rounded-xl transition-all",
                    "bg-caldera-orange hover:bg-caldera-orange-secondary",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {status === OverrideStatus.BUILDING && (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Building Transaction...
                    </>
                  )}
                  {status === OverrideStatus.SIGNING && (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Waiting for Signature...
                    </>
                  )}
                  {status === OverrideStatus.CONFIRMING && (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Confirming Transaction...
                    </>
                  )}
                  {status === OverrideStatus.IDLE && (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Approve Override
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                {/* Status Messages */}
                {status === OverrideStatus.CONFIRMING && (
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>This may take a few seconds on devnet...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-caldera-light-gray flex items-center justify-center p-4">
      {/* Background gradient matching landing page */}
      <div className="fixed inset-0 bg-gradient-to-br from-caldera-orange/5 via-transparent to-caldera-yellow/5 pointer-events-none" />
      
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-caldera-orange flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-black text-caldera-dark-gray">AEGIS</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-100">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <Card className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-200 relative z-10 mt-16">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-caldera-orange flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-caldera-dark-gray">
            Override Request
          </CardTitle>
          <CardDescription className="text-gray-600">
            Review and approve this blocked transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {renderContent()}
        </CardContent>
      </Card>
      
      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-xs text-gray-500">
        © 2024 Aegis Vaults. Secure your AI agents.
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function OverridePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-caldera-light-gray flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-caldera-orange" />
      </div>
    }>
      <OverridePageContent />
    </Suspense>
  );
}
