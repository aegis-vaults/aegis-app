/**
 * Aegis Frontend - Solana Configuration
 */

import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { CONFIG } from '@/lib/constants';

// Singleton connection instance for performance
// Reusing the same connection avoids handshake overhead
let connectionInstance: Connection | null = null;

// Solana Connection (singleton pattern)
export const getConnection = (): Connection => {
  if (!connectionInstance) {
    connectionInstance = new Connection(CONFIG.SOLANA_RPC_URL, {
      commitment: 'confirmed',
      // Enable batch requests for better performance
      disableRetryOnRateLimit: false,
    });
  }
  return connectionInstance;
};

// Program ID
export const PROGRAM_ID = new PublicKey(CONFIG.PROGRAM_ID);

// Network/Cluster
export const NETWORK = CONFIG.SOLANA_NETWORK;

// Export connection instance
export const connection = getConnection();
