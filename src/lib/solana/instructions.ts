/**
 * Aegis Frontend - Solana Instructions
 * 
 * All vault-related instructions now require vault_nonce as the first argument
 * for proper PDA derivation (allows unlimited vaults per user).
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

  // Execute guarded transaction (owner-signed)
  executeGuarded: async (
    wallet: AnchorWallet,
    vault: PublicKey,
    destination: PublicKey,
    amount: bigint,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;
    const [vaultAuthority] = getVaultAuthorityPDA(vault);
    
    // Fee treasury PDA
    const [feeTreasury] = PublicKey.findProgramAddressSync(
      [Buffer.from('treasury')],
      program.programId
    );

    const tx = await program.methods
      .executeGuarded(new BN(vaultNonce.toString()), new BN(amount.toString()))
      .accounts({
        vault,
        authority,
        vaultAuthority,
        destination,
        feeTreasury,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    return { transaction: tx, vault };
  },

  // Execute agent transaction (agent-signed)
  executeAgent: async (
    wallet: AnchorWallet,
    vault: PublicKey,
    destination: PublicKey,
    amount: bigint,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const agentSigner = wallet.publicKey;
    const [vaultAuthority] = getVaultAuthorityPDA(vault);
    
    // Fee treasury PDA
    const [feeTreasury] = PublicKey.findProgramAddressSync(
      [Buffer.from('treasury')],
      program.programId
    );

    const tx = await program.methods
      .executeAgent(new BN(vaultNonce.toString()), new BN(amount.toString()))
      .accounts({
        vault,
        agentSigner,
        vaultAuthority,
        destination,
        feeTreasury,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    return { transaction: tx, vault };
  },

  // Create override request
  createOverride: async (
    wallet: AnchorWallet,
    vault: PublicKey,
    destination: PublicKey,
    amount: bigint,
    reason: number,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    // TODO: Get override nonce from vault account
    const tx = await program.methods
      .createOverride(new BN(vaultNonce.toString()), destination, new BN(amount.toString()), { exceededDailyLimit: {} })
      .accounts({
        vault,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    return { transaction: tx, vault };
  },

  // Approve override
  approveOverride: async (
    wallet: AnchorWallet,
    vault: PublicKey,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .approveOverride(new BN(vaultNonce.toString()))
      .accounts({
        vault,
        authority,
      })
      .transaction();

    return { transaction: tx, vault };
  },

  // Update daily limit
  updateDailyLimit: async (
    wallet: AnchorWallet,
    vault: PublicKey,
    newDailyLimit: bigint,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .updateDailyLimit(new BN(vaultNonce.toString()), new BN(newDailyLimit.toString()))
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
    address: PublicKey,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .addToWhitelist(new BN(vaultNonce.toString()), address)
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
    address: PublicKey,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .removeFromWhitelist(new BN(vaultNonce.toString()), address)
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
    vault: PublicKey,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .pauseVault(new BN(vaultNonce.toString()))
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
    vault: PublicKey,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .resumeVault(new BN(vaultNonce.toString()))
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
    newAgentSigner: PublicKey,
    vaultNonce: bigint
  ) => {
    const connection = getConnection();
    const program = getProgram(connection, wallet);
    const authority = wallet.publicKey;

    const tx = await program.methods
      .updateAgentSigner(new BN(vaultNonce.toString()), newAgentSigner)
      .accounts({
        vault,
        authority,
      })
      .transaction();

    return { transaction: tx, vault };
  },
};

export default instructions;
