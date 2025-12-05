/**
 * Aegis Frontend - API Type Definitions
 * These types match the aegis-guardian backend Prisma schema
 */

// ============================================================================
// Enums
// ============================================================================

export enum VaultTier {
  PERSONAL = 'PERSONAL',
  TEAM = 'TEAM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  EXECUTED = 'EXECUTED',
  BLOCKED = 'BLOCKED',
  FAILED = 'FAILED',
}

export enum OverrideStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum WebhookEvent {
  TRANSACTION_EXECUTED = 'TRANSACTION_EXECUTED',
  TRANSACTION_BLOCKED = 'TRANSACTION_BLOCKED',
  OVERRIDE_REQUESTED = 'OVERRIDE_REQUESTED',
  OVERRIDE_APPROVED = 'OVERRIDE_APPROVED',
  OVERRIDE_EXECUTED = 'OVERRIDE_EXECUTED',
  POLICY_UPDATED = 'POLICY_UPDATED',
  VAULT_PAUSED = 'VAULT_PAUSED',
  VAULT_RESUMED = 'VAULT_RESUMED',
}

export enum BlockReason {
  NOT_WHITELISTED = 'NOT_WHITELISTED',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  VAULT_PAUSED = 'VAULT_PAUSED',
}

// ============================================================================
// Core Data Models
// ============================================================================

export interface Vault {
  id: string;
  publicKey: string;
  owner: string;
  guardian: string;
  agentSigner: string; // AI agent public key authorized to propose transactions
  userId: string | null;
  name: string | null;
  dailyLimit: string; // BigInt as string
  dailySpent: string; // BigInt as string
  lastResetTime: string; // BigInt as string (Unix timestamp)
  whitelistEnabled: boolean;
  whitelist: string[]; // Array of addresses (max 20)
  overrideDelay: number; // Seconds
  pendingOverride: boolean;
  isActive: boolean;
  paused: boolean;
  tier: VaultTier;
  feeBasisPoints: number;
  vaultNonce: string; // BigInt as string - nonce used for PDA derivation
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  // Counts (from list endpoint)
  transactionCount?: number;
  overrideCount?: number;
  // Relations (optional, populated when requested)
  transactions?: Transaction[];
  overrides?: Override[];
  teamMembers?: TeamMember[];
  feeCollections?: FeeCollection[];
}

export interface Transaction {
  id: string;
  signature: string;
  vaultId: string;
  from: string;
  to: string;
  amount: string; // BigInt as string (lamports)
  instruction: string | null; // Serialized instruction data
  status: TransactionStatus;
  blockReason: BlockReason | null;
  executedAt: string | null; // ISO timestamp
  blockedAt: string | null; // ISO timestamp
  slot: string | null; // BigInt as string
  blockTime: string | null; // BigInt as string
  blinkId: string | null;
  createdAt: string; // ISO timestamp
  // Relations (optional)
  vault?: Vault;
  blink?: Blink;
  feeCollections?: FeeCollection[];
}

export interface Override {
  id: string;
  vaultId: string;
  transactionId: string;
  nonce: string; // BigInt as string
  requestedBy: string; // Wallet address
  requestedAmount: string | null; // BigInt as string (lamports)
  destination: string | null; // Wallet address
  blinkUrl: string | null;
  canExecuteAfter: string; // BigInt as string (Unix timestamp)
  expiresAt: string; // BigInt as string (Unix timestamp)
  status: OverrideStatus;
  approvedBy: string | null; // Wallet address
  approvedAt: string | null; // ISO timestamp
  executedAt: string | null; // ISO timestamp
  cancelledAt: string | null; // ISO timestamp
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  // Relations (optional)
  vault?: Vault;
}

export interface User {
  id: string;
  walletAddress: string;
  email: string | null;
  tier: VaultTier;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null; // ISO timestamp
  telegramChatId: string | null;
  discordWebhook: string | null;
  webhookUrl: string | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  // Relations (optional)
  vaults?: Vault[];
  teamMembers?: TeamMember[];
}

export interface TeamMember {
  id: string;
  userId: string;
  vaultId: string;
  role: TeamRole;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  // Relations (optional)
  user?: User;
  vault?: Vault;
}

export interface Blink {
  id: string;
  actionUrl: string;
  title: string;
  description: string | null;
  iconUrl: string | null;
  label: string;
  vaultId: string | null;
  overrideId: string | null;
  isActive: boolean;
  usedCount: number;
  expiresAt: string | null; // ISO timestamp
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  // Relations (optional)
  transactions?: Transaction[];
}

export interface Webhook {
  id: string;
  url: string;
  secret: string; // HMAC secret (only returned on creation)
  vaultId: string | null; // null = all vaults
  events: WebhookEvent[];
  isActive: boolean;
  failureCount: number;
  lastSuccess: string | null; // ISO timestamp
  lastFailure: string | null; // ISO timestamp
  maxRetries: number;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface DailyMetrics {
  id: string;
  date: string; // Date (ISO date string)
  vaultId: string | null; // null = global metrics
  totalTransactions: number;
  executedTransactions: number;
  blockedTransactions: number;
  failedTransactions: number;
  totalVolume: string; // BigInt as string (lamports)
  executedVolume: string; // BigInt as string
  blockedVolume: string; // BigInt as string
  overridesRequested: number;
  overridesApproved: number;
  overridesExecuted: number;
  avgProcessingTimeMs: number | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface FeeCollection {
  id: string;
  vaultId: string;
  transactionId: string;
  amount: string; // BigInt as string (lamports)
  timestamp: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  // Relations (optional)
  vault?: Vault;
  transaction?: Transaction;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface VaultAnalytics {
  vaultId: string;
  timeRange: '7d' | '30d' | '90d';
  totalSpent: string; // BigInt as string (lamports)
  transactionCount: number;
  executedCount: number;
  blockedCount: number;
  failedCount: number;
  successRate: number; // Percentage (0-100)
  avgTransactionSize: string; // BigInt as string (lamports)
  topDestinations: {
    address: string;
    count: number;
    totalAmount: string; // BigInt as string
  }[];
  blockReasons: {
    reason: BlockReason;
    count: number;
  }[];
  feesCollected: string; // BigInt as string (lamports)
}

export interface SpendingTrend {
  date: string; // ISO date string
  spent: string; // BigInt as string (lamports)
  transactionCount: number;
}

export interface FeeAnalytics {
  totalFees: string; // BigInt as string (lamports)
  feesByVault: {
    vaultId: string;
    vaultName: string | null;
    amount: string; // BigInt as string
  }[];
  feesByPeriod: {
    date: string; // ISO date string
    amount: string; // BigInt as string
  }[];
  feesByTier: {
    tier: VaultTier;
    amount: string; // BigInt as string
  }[];
}

export interface GlobalAnalytics {
  totalVaults: number;
  activeVaults: number;
  totalTransactions: number;
  totalVolume: string; // BigInt as string (lamports)
  protocolFeesCollected: string; // BigInt as string (lamports)
  avgSuccessRate: number; // Percentage (0-100)
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      hasNext: boolean;
      hasPrevious?: boolean;
      totalPages?: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// Request Parameter Types
// ============================================================================

export interface ListVaultsParams {
  page?: number;
  pageSize?: number;
  owner?: string;
  guardian?: string;
  isActive?: boolean;
  myVaults?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dailyLimit' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface ListTransactionsParams {
  page?: number;
  pageSize?: number;
  vaultId?: string;
  status?: TransactionStatus;
  from?: string;
  to?: string;
  startDate?: string; // ISO timestamp
  endDate?: string; // ISO timestamp
  minAmount?: string; // BigInt as string (lamports)
  maxAmount?: string; // BigInt as string (lamports)
  myTransactions?: boolean; // Filter to only user's vault transactions
}

export interface ListOverridesParams {
  page?: number;
  pageSize?: number;
  vaultId?: string;
  status?: OverrideStatus;
  requestedBy?: string;
  approvedBy?: string;
  startDate?: string; // ISO timestamp
  endDate?: string; // ISO timestamp
}

export interface CreateVaultParams {
  owner: string;
  guardian: string;
  agentSigner: string;
  dailyLimit: string; // BigInt as string (lamports)
  name?: string;
  whitelistEnabled?: boolean;
  whitelist?: string[];
  tier?: VaultTier;
}

export interface UpdateVaultParams {
  name?: string;
  dailyLimit?: string; // BigInt as string (lamports)
  whitelistEnabled?: boolean;
  whitelist?: string[];
  paused?: boolean;
}

export interface ApproveOverrideParams {
  approvedBy: string; // Wallet address of approver
}

// ============================================================================
// Utility Types
// ============================================================================

export type SolanaNetwork = 'devnet' | 'mainnet-beta' | 'testnet' | 'localnet';

export interface Config {
  cluster: SolanaNetwork;
  programId: string;
  guardianApiUrl: string;
  rpcUrl: string;
}

// Helper to convert BigInt string to lamports
export function lamportsToString(lamports: bigint): string {
  return lamports.toString();
}

// Helper to convert BigInt string to SOL
export function lamportsToSol(lamports: string): number {
  return Number(lamports) / 1e9;
}

// Helper to convert SOL to lamports string
export function solToLamports(sol: number): string {
  return Math.floor(sol * 1e9).toString();
}

// Helper to format SOL display
export function formatSol(lamports: string, decimals: number = 4): string {
  const sol = lamportsToSol(lamports);
  return sol.toFixed(decimals);
}

// Helper to format address (truncate middle)
export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length < chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Helper to check if address is valid Solana address
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded, 32-44 characters
  if (!address || address.length < 32 || address.length > 44) return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}
