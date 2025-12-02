/**
 * Aegis Frontend - Solana Configuration
 */

import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { CONFIG } from '@/lib/constants';

// Solana Connection
export const getConnection = (): Connection => {
  return new Connection(CONFIG.SOLANA_RPC_URL, 'confirmed');
};

// Program ID
export const PROGRAM_ID = new PublicKey(CONFIG.PROGRAM_ID);

// Network/Cluster
export const NETWORK = CONFIG.SOLANA_NETWORK;

// Export connection instance
export const connection = getConnection();
