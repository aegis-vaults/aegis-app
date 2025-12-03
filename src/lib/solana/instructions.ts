/**
 * Aegis Frontend - Solana Instructions
 */

import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';
import { getProgram, getVaultPDA, getVaultAuthorityPDA } from './program';
import { getConnection } from './config';

export const instructions = {
  // Initialize vault instruction with nonce for unlimited vaults
  initializeVault: async (
    wallet: AnchorWallet,
    agentSigner: PublicKey,
    dailyLimit: bigint,
    name: string,
    nonce?: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    // Generate a unique nonce if not provided (allows unlimited vaults)
    const { generateVaultNonce } = await import('./program');
    const vaultNonce = nonce ?? generateVaultNonce();

    // Derive PDAs with nonce
    const [vault] = getVaultPDA(authority, vaultNonce);
    const [vaultAuthority] = getVaultAuthorityPDA(vault);

    // Build instruction with nonce as first argument
    const tx = await program.methods
      .initializeVault(new BN(vaultNonce.toString()), agentSigner, new BN(dailyLimit.toString()), name)
      .accounts({
        vault,
        vaultAuthority,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    return { transaction: tx, vault, vaultAuthority, nonce: vaultNonce };
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
    wallet: AnchorWallet,
    vault: PublicKey,
    newDailyLimit: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .updateDailyLimit(new BN(newDailyLimit.toString()))
      .accounts({
        vault,
        authority,
      })
      .transaction();

    return { transaction: tx, vault };
  },

  // Add to whitelist
  addToWhitelist: async (
    wallet: AnchorWallet,
    vault: PublicKey,
    address: PublicKey
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .addToWhitelist(address)
      .accounts({
        vault,
        authority,
      })
      .transaction();

    return { transaction: tx, vault };
  },

  // Remove from whitelist
  removeFromWhitelist: async (
    wallet: AnchorWallet,
    vault: PublicKey,
    address: PublicKey
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .removeFromWhitelist(address)
      .accounts({
        vault,
        authority,
      })
      .transaction();

    return { transaction: tx, vault };
  },

  // Pause vault
  pauseVault: async (
    wallet: AnchorWallet,
    vault: PublicKey
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .pauseVault()
      .accounts({
        vault,
        authority,
      })
      .transaction();

    return { transaction: tx, vault };
  },

  // Resume vault
  resumeVault: async (
    wallet: AnchorWallet,
    vault: PublicKey
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .resumeVault()
      .accounts({
        vault,
        authority,
      })
      .transaction();

    return { transaction: tx, vault };
  },

  // Update agent signer
  updateAgentSigner: async (
    wallet: AnchorWallet,
    vault: PublicKey,
    newAgentSigner: PublicKey
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .updateAgentSigner(newAgentSigner)
      .accounts({
        vault,
        authority,
      })
      .transaction();

    return { transaction: tx, vault };
  },
};

export default instructions;
