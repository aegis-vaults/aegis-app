/**
 * Aegis Frontend - Anchor Program Client
 */

import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { PublicKey, Connection } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { PROGRAM_ID } from './config';
import idl from './idl/aegis_core.json';

export type AegisCore = Idl;

/**
 * Get Anchor program instance
 */
export function getProgram(
  connection: Connection,
  wallet: AnchorWallet
): Program<Idl> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });

  return new Program(idl as Idl, provider);
}

/**
 * Derive vault PDA
 */
export function getVaultPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), authority.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive vault authority PDA
 */
export function getVaultAuthorityPDA(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault_authority'), vault.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive override PDA
 */
export function getOverridePDA(vault: PublicKey, nonce: bigint): [PublicKey, number] {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigUInt64LE(nonce);

  return PublicKey.findProgramAddressSync(
    [Buffer.from('override'), vault.toBuffer(), nonceBuffer],
    PROGRAM_ID
  );
}

/**
 * Derive treasury PDA
 */
export function getTreasuryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('treasury')],
    PROGRAM_ID
  );
}
