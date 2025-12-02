/**
 * Aegis Frontend - PDA Derivation Functions
 */

import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './config';
import { PDA_SEEDS } from '@/lib/constants';

/**
 * Derive Vault PDA
 * Seeds: ["vault", authority]
 */
export function getVaultPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.VAULT), authority.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive Vault Authority PDA (holds actual funds)
 * Seeds: ["vault_authority", vault]
 */
export function getVaultAuthorityPDA(vault: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.VAULT_AUTHORITY), vault.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive Pending Override PDA
 * Seeds: ["override", vault, nonce.to_le_bytes()]
 */
export function getOverridePDA(vault: PublicKey, nonce: bigint): [PublicKey, number] {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigUInt64LE(nonce);

  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.OVERRIDE), vault.toBuffer(), nonceBuffer],
    PROGRAM_ID
  );
}

/**
 * Derive Fee Treasury PDA
 * Seeds: ["treasury"]
 */
export function getTreasuryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.TREASURY)],
    PROGRAM_ID
  );
}
