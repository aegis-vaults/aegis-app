/**
 * Aegis Frontend - Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid } from 'date-fns';

// ============================================================================
// Tailwind Utilities
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Formatting Utilities
// ============================================================================

// Format SOL amount
export function formatSol(lamports: string | number, decimals: number = 4): string {
  const amount = typeof lamports === 'string' ? Number(lamports) : lamports;
  const sol = amount / 1e9;
  return sol.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format USD amount
export function formatUsd(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// Format large numbers (1000 -> 1K, 1000000 -> 1M)
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'B';
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

// Format Solana address (truncate middle)
export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length < chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Format transaction signature
export function formatSignature(signature: string, chars: number = 8): string {
  return formatAddress(signature, chars);
}

// ============================================================================
// Date/Time Utilities
// ============================================================================

// Format timestamp to relative time (e.g., "2 minutes ago")
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (!isValid(date)) return 'Invalid date';
  return formatDistanceToNow(date, { addSuffix: true });
}

// Format timestamp to absolute time
export function formatAbsoluteTime(timestamp: string | Date, formatString: string = 'MMM d, yyyy HH:mm'): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (!isValid(date)) return 'Invalid date';
  return format(date, formatString);
}

// Format Unix timestamp (BigInt as string)
export function formatUnixTimestamp(timestamp: string, formatString: string = 'MMM d, yyyy HH:mm'): string {
  const date = new Date(Number(timestamp) * 1000);
  if (!isValid(date)) return 'Invalid date';
  return format(date, formatString);
}

// ============================================================================
// Validation Utilities
// ============================================================================

// Check if string is valid Solana address
export function isValidSolanaAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}

// Check if string is valid amount (positive number)
export function isValidAmount(amount: string): boolean {
  const num = Number(amount);
  return !isNaN(num) && num > 0;
}

// Check if string is valid email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================================================
// Conversion Utilities
// ============================================================================

// Convert SOL to lamports
export function solToLamports(sol: number): string {
  return Math.floor(sol * 1e9).toString();
}

// Convert lamports to SOL
export function lamportsToSol(lamports: string | number): number {
  const amount = typeof lamports === 'string' ? Number(lamports) : lamports;
  return amount / 1e9;
}

// Convert BigInt string to number
export function bigIntToNumber(value: string): number {
  return Number(value);
}

// ============================================================================
// URL Utilities
// ============================================================================

// Get explorer URL for transaction
export function getExplorerUrl(
  type: 'tx' | 'address' | 'account',
  value: string,
  cluster: 'devnet' | 'mainnet-beta' = 'devnet'
): string {
  const baseUrl = cluster === 'devnet'
    ? 'https://solscan.io'
    : 'https://solscan.io';

  const suffix = cluster === 'devnet' ? '?cluster=devnet' : '';

  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${value}${suffix}`;
    case 'address':
    case 'account':
      return `${baseUrl}/account/${value}${suffix}`;
    default:
      return baseUrl;
  }
}

// ============================================================================
// Clipboard Utilities
// ============================================================================

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// ============================================================================
// Array Utilities
// ============================================================================

// Remove duplicates from array
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// Group array by key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// ============================================================================
// Async Utilities
// ============================================================================

// Sleep/delay function
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry function with exponential backoff
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }
  throw new Error('Retry failed');
}

// ============================================================================
// Error Utilities
// ============================================================================

// Extract error message from unknown error
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// ============================================================================
// Local Storage Utilities
// ============================================================================

// Safe local storage get
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

// Safe local storage set
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

// Safe local storage remove
export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

// ============================================================================
// Math Utilities
// ============================================================================

// Clamp number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// Round to decimal places
export function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
