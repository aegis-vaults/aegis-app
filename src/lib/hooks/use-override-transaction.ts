/**
 * Aegis Frontend - Override Transaction Hook
 * 
 * Handles building and sending override transactions for blocked transactions.
 * Calls the Guardian API to build the transaction server-side, then signs and
 * submits it client-side using the connected wallet.
 */

import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { CONFIG } from '@/lib/constants';

// Transaction status enum
export enum OverrideStatus {
  IDLE = 'idle',
  BUILDING = 'building',
  SIGNING = 'signing',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error',
}

// Hook input parameters
interface UseOverrideTransactionParams {
  vault: string;
  destination: string;
  amount: string;
  reason: string;
}

// Hook return type
interface UseOverrideTransactionReturn {
  status: OverrideStatus;
  error: string | null;
  signature: string | null;
  executeOverride: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for building and executing override transactions
 */
export function useOverrideTransaction(
  params: UseOverrideTransactionParams
): UseOverrideTransactionReturn {
  const { vault, destination, amount, reason } = params;
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [status, setStatus] = useState<OverrideStatus>(OverrideStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // Reset state
  const reset = useCallback(() => {
    setStatus(OverrideStatus.IDLE);
    setError(null);
    setSignature(null);
  }, []);

  // Execute the override
  const executeOverride = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected');
      setStatus(OverrideStatus.ERROR);
      return;
    }

    try {
      // Step 1: Build transaction via Guardian API
      setStatus(OverrideStatus.BUILDING);
      setError(null);

      const buildResponse = await fetch(`${CONFIG.GUARDIAN_API_URL}/api/override/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vault,
          destination,
          amount,
          reason,
          signer: publicKey.toBase58(),
        }),
      });

      if (!buildResponse.ok) {
        const errorData = await buildResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to build transaction: ${buildResponse.status}`);
      }

      const buildResult = await buildResponse.json();

      if (!buildResult.transaction) {
        throw new Error('No transaction returned from server');
      }

      // Step 2: Deserialize and sign the transaction
      setStatus(OverrideStatus.SIGNING);

      const transactionBuffer = Buffer.from(buildResult.transaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuffer);

      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);

      // Step 3: Send and confirm the transaction
      setStatus(OverrideStatus.CONFIRMING);

      // Send raw transaction
      const txSignature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      // Wait for confirmation with timeout
      const confirmationResult = await connection.confirmTransaction(
        {
          signature: txSignature,
          blockhash: buildResult.blockhash,
          lastValidBlockHeight: buildResult.lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmationResult.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmationResult.value.err)}`);
      }

      // Success!
      setSignature(txSignature);
      setStatus(OverrideStatus.SUCCESS);

    } catch (err) {
      console.error('Override transaction failed:', err);
      
      // Handle specific error types
      let errorMessage = 'An unknown error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Handle user rejection
        if (errorMessage.includes('User rejected') || errorMessage.includes('rejected the request')) {
          errorMessage = 'Transaction was rejected by wallet';
        }
        
        // Handle timeout errors
        if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          errorMessage = 'Transaction timed out. It may still succeed - please check your vault.';
        }

        // Handle simulation errors
        if (errorMessage.includes('simulation failed') || errorMessage.includes('Simulation failed')) {
          errorMessage = 'Transaction simulation failed. The transaction parameters may be invalid.';
        }

        // Handle authority errors
        if (errorMessage.includes('Only the vault owner')) {
          errorMessage = 'Only the vault owner can approve this override. Please connect with the correct wallet.';
        }
      }

      setError(errorMessage);
      setStatus(OverrideStatus.ERROR);
    }
  }, [publicKey, signTransaction, connection, vault, destination, amount, reason]);

  return {
    status,
    error,
    signature,
    executeOverride,
    reset,
  };
}

