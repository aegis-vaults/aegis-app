/**
 * Aegis Frontend - Solana Instructions
 */

import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';
import { getProgram, getVaultPDA, getVaultAuthorityPDA } from './program';
import { getConnection } from './config';

export const instructions = {
  // Initialize vault instruction
  initializeVault: async (
    wallet: AnchorWallet,
    agentSigner: PublicKey,
    dailyLimit: bigint,
    name: string
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    // Derive PDAs
    const [vault] = getVaultPDA(authority);
    const [vaultAuthority] = getVaultAuthorityPDA(vault);

    // Build instruction
    const tx = await program.methods
      .initializeVault(agentSigner, new BN(dailyLimit.toString()), name)
      .accounts({
        vault,
        vaultAuthority,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    return { transaction: tx, vault, vaultAuthority };
  },

  // Execute guarded transaction
  executeGuarded: async (
    authority: PublicKey,
    vault: PublicKey,
    destination: PublicKey,
    amount: bigint
  ): Promise<Transaction> => {
    // TODO: Implement with Anchor
    const transaction = new Transaction();
    console.log('executeGuarded placeholder:', { authority, vault, destination, amount });
    return transaction;
  },

  // Create override request
  createOverride: async (
    authority: PublicKey,
    vault: PublicKey,
    destination: PublicKey,
    amount: bigint,
    reason: number
  ): Promise<Transaction> => {
    // TODO: Implement with Anchor
    const transaction = new Transaction();
    console.log('createOverride placeholder:', { authority, vault, destination, amount, reason });
    return transaction;
  },

  // Approve override
  approveOverride: async (
    authority: PublicKey,
    vault: PublicKey,
    nonce: bigint
  ): Promise<Transaction> => {
    // TODO: Implement with Anchor
    const transaction = new Transaction();
    console.log('approveOverride placeholder:', { authority, vault, nonce });
    return transaction;
  },

  // Update daily limit
  updateDailyLimit: async (
    authority: PublicKey,
    vault: PublicKey,
    newDailyLimit: bigint
  ): Promise<Transaction> => {
    // TODO: Implement with Anchor
    const transaction = new Transaction();
    console.log('updateDailyLimit placeholder:', { authority, vault, newDailyLimit });
    return transaction;
  },

  // Add to whitelist
  addToWhitelist: async (
    authority: PublicKey,
    vault: PublicKey,
    address: PublicKey
  ): Promise<Transaction> => {
    // TODO: Implement with Anchor
    const transaction = new Transaction();
    console.log('addToWhitelist placeholder:', { authority, vault, address });
    return transaction;
  },

  // Remove from whitelist
  removeFromWhitelist: async (
    authority: PublicKey,
    vault: PublicKey,
    address: PublicKey
  ): Promise<Transaction> => {
    // TODO: Implement with Anchor
    const transaction = new Transaction();
    console.log('removeFromWhitelist placeholder:', { authority, vault, address });
    return transaction;
  },

  // Pause vault
  pauseVault: async (
    authority: PublicKey,
    vault: PublicKey
  ): Promise<Transaction> => {
    // TODO: Implement with Anchor
    const transaction = new Transaction();
    console.log('pauseVault placeholder:', { authority, vault });
    return transaction;
  },

  // Resume vault
  resumeVault: async (
    authority: PublicKey,
    vault: PublicKey
  ): Promise<Transaction> => {
    // TODO: Implement with Anchor
    const transaction = new Transaction();
    console.log('resumeVault placeholder:', { authority, vault });
    return transaction;
  },
};

export default instructions;
