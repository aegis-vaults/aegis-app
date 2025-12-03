/**
 * Aegis Frontend - API Methods
 * All API calls to aegis-guardian backend
 */

import apiClient from './client';
import {
  Vault,
  Transaction,
  Override,
  VaultAnalytics,
  SpendingTrend,
  FeeAnalytics,
  GlobalAnalytics,
  ApiResponse,
  PaginatedResponse,
  ListVaultsParams,
  ListTransactionsParams,
  ListOverridesParams,
  UpdateVaultParams,
  ApproveOverrideParams,
} from '@/types/api';
import { API_ENDPOINTS } from '@/lib/constants';

// ============================================================================
// Vault API
// ============================================================================

export const vaultApi = {
  // List all vaults with pagination and filters
  list: async (params?: ListVaultsParams): Promise<PaginatedResponse<Vault>> => {
    return apiClient.get<PaginatedResponse<Vault>>(API_ENDPOINTS.VAULTS, params);
  },

  // Get single vault by ID
  get: async (id: string): Promise<ApiResponse<Vault>> => {
    return apiClient.get<ApiResponse<Vault>>(`${API_ENDPOINTS.VAULTS}/${id}`);
  },

  // Update vault configuration
  update: async (id: string, data: UpdateVaultParams): Promise<ApiResponse<Vault>> => {
    return apiClient.patch<ApiResponse<Vault>>(`${API_ENDPOINTS.VAULTS}/${id}`, data);
  },

  // Soft delete vault
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`${API_ENDPOINTS.VAULTS}/${id}`);
  },

  // Link vault to authenticated user
  link: async (vaultPublicKey: string, name?: string): Promise<ApiResponse<Vault>> => {
    return apiClient.post<ApiResponse<Vault>>(`${API_ENDPOINTS.VAULTS}/link`, {
      vaultPublicKey,
      name,
    });
  },

  // Sync vault from blockchain (manual sync when event listener misses events)
  sync: async (vaultPublicKey: string): Promise<ApiResponse<Vault>> => {
    return apiClient.post<ApiResponse<Vault>>(`${API_ENDPOINTS.VAULTS}/sync`, {
      vaultPublicKey,
    });
  },

  // Team management
  team: {
    // List team members for a vault
    list: async (vaultId: string): Promise<ApiResponse<any[]>> => {
      return apiClient.get<ApiResponse<any[]>>(`${API_ENDPOINTS.VAULTS}/${vaultId}/team`);
    },

    // Add team member to a vault
    add: async (
      vaultId: string,
      data: { userWalletAddress: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' }
    ): Promise<ApiResponse<any>> => {
      return apiClient.post<ApiResponse<any>>(`${API_ENDPOINTS.VAULTS}/${vaultId}/team`, data);
    },

    // Update team member role
    updateRole: async (
      vaultId: string,
      memberId: string,
      role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
    ): Promise<ApiResponse<any>> => {
      return apiClient.patch<ApiResponse<any>>(
        `${API_ENDPOINTS.VAULTS}/${vaultId}/team/${memberId}`,
        { role }
      );
    },

    // Remove team member
    remove: async (vaultId: string, memberId: string): Promise<ApiResponse<void>> => {
      return apiClient.delete<ApiResponse<void>>(
        `${API_ENDPOINTS.VAULTS}/${vaultId}/team/${memberId}`
      );
    },
  },
};

// ============================================================================
// Transaction API
// ============================================================================

export const transactionApi = {
  // List transactions with pagination and filters
  list: async (params?: ListTransactionsParams): Promise<PaginatedResponse<Transaction>> => {
    return apiClient.get<PaginatedResponse<Transaction>>(API_ENDPOINTS.TRANSACTIONS, params);
  },

  // Get single transaction by ID
  get: async (id: string): Promise<ApiResponse<Transaction>> => {
    return apiClient.get<ApiResponse<Transaction>>(`${API_ENDPOINTS.TRANSACTIONS}/${id}`);
  },

  // Record a transaction after it's been executed on-chain
  record: async (data: {
    signature: string;
    vaultPublicKey: string;
    from: string;
    to: string;
    amount: string;
    status: 'PENDING' | 'EXECUTED' | 'BLOCKED' | 'FAILED';
    blockReason?: string;
  }): Promise<ApiResponse<Transaction>> => {
    return apiClient.post<ApiResponse<Transaction>>(API_ENDPOINTS.TRANSACTIONS, data);
  },
};

// ============================================================================
// Override API
// ============================================================================

export const overrideApi = {
  // List override requests with pagination and filters
  list: async (params?: ListOverridesParams): Promise<PaginatedResponse<Override>> => {
    return apiClient.get<PaginatedResponse<Override>>(API_ENDPOINTS.OVERRIDES, params);
  },

  // Get single override by ID
  get: async (id: string): Promise<ApiResponse<Override>> => {
    return apiClient.get<ApiResponse<Override>>(`${API_ENDPOINTS.OVERRIDES}/${id}`);
  },

  // Approve override request
  approve: async (id: string, data: ApproveOverrideParams): Promise<ApiResponse<Override>> => {
    return apiClient.post<ApiResponse<Override>>(`${API_ENDPOINTS.OVERRIDES}/${id}`, data);
  },

  // Cancel override request
  cancel: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`${API_ENDPOINTS.OVERRIDES}/${id}`);
  },
};

// ============================================================================
// Analytics API
// ============================================================================

export const analyticsApi = {
  // Get global analytics (all vaults)
  global: async (): Promise<ApiResponse<GlobalAnalytics>> => {
    return apiClient.get<ApiResponse<GlobalAnalytics>>(`${API_ENDPOINTS.ANALYTICS}/global`);
  },

  // Get vault-specific analytics
  vault: async (vaultId: string, timeRange?: '7d' | '30d' | '90d'): Promise<ApiResponse<VaultAnalytics>> => {
    return apiClient.get<ApiResponse<VaultAnalytics>>(
      `${API_ENDPOINTS.ANALYTICS}/${vaultId}`,
      timeRange ? { timeRange } : undefined
    );
  },

  // Get spending trend for vault
  spendingTrend: async (vaultId: string, days?: number): Promise<ApiResponse<SpendingTrend[]>> => {
    return apiClient.get<ApiResponse<SpendingTrend[]>>(
      `${API_ENDPOINTS.ANALYTICS}/${vaultId}/spending-trend`,
      days ? { days } : undefined
    );
  },

  // Get fee analytics
  fees: async (): Promise<ApiResponse<FeeAnalytics>> => {
    return apiClient.get<ApiResponse<FeeAnalytics>>(`${API_ENDPOINTS.ANALYTICS}/fees`);
  },
};

// ============================================================================
// Health API
// ============================================================================

export const healthApi = {
  // Health check
  check: async (): Promise<ApiResponse<{ status: string; uptime: number; database: string; redis: string }>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.HEALTH);
  },
};

// Export all APIs
export const api = {
  vaults: vaultApi,
  transactions: transactionApi,
  overrides: overrideApi,
  analytics: analyticsApi,
  health: healthApi,
};

export default api;
