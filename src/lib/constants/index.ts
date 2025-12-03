/**
 * Aegis Frontend - Constants
 */

import { SolanaNetwork } from '@/types/api';

// Configuration from environment variables
export const CONFIG = {
  GUARDIAN_API_URL: process.env.NEXT_PUBLIC_GUARDIAN_API_URL || 'http://localhost:3000',
  SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  SOLANA_NETWORK: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as SolanaNetwork,
  PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID || 'ET9WDoFE2bf4bSmciLL7q7sKdeSYeNkWbNMHbAMBu2ZJ',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  VAULTS: '/api/vaults',
  TRANSACTIONS: '/api/transactions',
  OVERRIDES: '/api/overrides',
  ANALYTICS: '/api/analytics',
  ACTIONS: '/api/actions',
  WEBHOOKS: '/api/webhooks',
} as const;

// Solana Constants
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const MIN_RENT_EXEMPT_BALANCE = 890_880; // Approx 0.00089088 SOL

// Protocol Constants (match smart contract)
export const PROTOCOL_CONSTANTS = {
  MAX_WHITELIST_SIZE: 20,
  MAX_NAME_LENGTH: 50,
  DEFAULT_FEE_BASIS_POINTS: 5, // 0.05%
  SECONDS_PER_DAY: 86400,
  DEFAULT_OVERRIDE_EXPIRATION: 3600, // 1 hour
} as const;

// PDA Seeds
export const PDA_SEEDS = {
  VAULT: 'vault',
  VAULT_AUTHORITY: 'vault_authority',
  OVERRIDE: 'override',
  TREASURY: 'treasury',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// React Query Cache Times
export const CACHE_TIMES = {
  VAULT: 30_000, // 30 seconds
  VAULTS_LIST: 30_000,
  TRANSACTION: 60_000, // 1 minute
  TRANSACTIONS_LIST: 15_000, // 15 seconds
  OVERRIDE: 10_000, // 10 seconds
  OVERRIDES_LIST: 10_000,
  ANALYTICS: 300_000, // 5 minutes
  GLOBAL_ANALYTICS: 300_000,
} as const;

// WebSocket Events
export const WS_EVENTS = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  TRANSACTION: 'transaction',
  OVERRIDE_REQUESTED: 'override-requested',
  OVERRIDE_RESOLVED: 'override-resolved',
  VAULT_UPDATED: 'vault-updated',
  POLICY_UPDATED: 'policy-updated',
} as const;

// Status Display Names
export const STATUS_DISPLAY = {
  TRANSACTION: {
    PENDING: 'Pending',
    EXECUTED: 'Executed',
    BLOCKED: 'Blocked',
    FAILED: 'Failed',
  },
  OVERRIDE: {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    EXECUTED: 'Executed',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  },
} as const;

// Status Colors (Tailwind classes)
export const STATUS_COLORS = {
  TRANSACTION: {
    PENDING: 'bg-aegis-amber text-aegis-bg-primary',
    EXECUTED: 'bg-aegis-emerald text-aegis-bg-primary',
    BLOCKED: 'bg-aegis-crimson text-white',
    FAILED: 'bg-gray-500 text-white',
  },
  OVERRIDE: {
    PENDING: 'bg-aegis-amber text-aegis-bg-primary',
    APPROVED: 'bg-aegis-blue text-aegis-bg-primary',
    EXECUTED: 'bg-aegis-emerald text-aegis-bg-primary',
    CANCELLED: 'bg-gray-500 text-white',
    EXPIRED: 'bg-gray-600 text-white',
  },
} as const;

// Explorer URLs
export const EXPLORER_URLS = {
  devnet: {
    solscan: 'https://solscan.io',
    solana: 'https://explorer.solana.com',
    solanafm: 'https://solana.fm',
  },
  'mainnet-beta': {
    solscan: 'https://solscan.io',
    solana: 'https://explorer.solana.com',
    solanafm: 'https://solana.fm',
  },
} as const;

// Navigation Items
export const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { name: 'Vaults', href: '/vaults', icon: 'Vault' },
  { name: 'Transactions', href: '/transactions', icon: 'ArrowRightLeft' },
  { name: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { name: 'Security', href: '/security', icon: 'Shield' },
  { name: 'Settings', href: '/settings', icon: 'Settings' },
] as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'aegis-theme',
  SIDEBAR_COLLAPSED: 'aegis-sidebar-collapsed',
  VAULT_VIEW_MODE: 'aegis-vault-view-mode',
  VAULT_SORT: 'aegis-vault-sort',
  RECENT_SEARCHES: 'aegis-recent-searches',
  DRAFT_VAULT: 'aegis-draft-vault',
  AUTH_USER_ID: 'aegis-auth-user-id',
} as const;

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500,
} as const;

// Toast Messages
export const TOAST_MESSAGES = {
  VAULT_CREATED: 'Vault created successfully',
  VAULT_UPDATED: 'Vault updated successfully',
  VAULT_DELETED: 'Vault deleted successfully',
  TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
  OVERRIDE_REQUESTED: 'Override request created',
  OVERRIDE_APPROVED: 'Override approved successfully',
  OVERRIDE_CANCELLED: 'Override cancelled',
  COPY_SUCCESS: 'Copied to clipboard',
  ERROR_GENERIC: 'An error occurred. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
} as const;
// Trigger rebuild 1764725384
