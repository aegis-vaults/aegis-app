/**
 * Aegis Frontend - API Client
 * Base client for communicating with aegis-guardian backend
 */

import { CONFIG } from '@/lib/constants';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { retry } from '@/lib/utils';

// ============================================================================
// Base Client
// ============================================================================

class ApiClient {
  private baseUrl: string;
  private userId: string | null = null;

  constructor(baseUrl: string = CONFIG.GUARDIAN_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the user ID (wallet public key) for authentication
   * This will be sent as x-user-id header in all requests
   */
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add x-user-id header if userId is set
    if (this.userId) {
      defaultHeaders['x-user-id'] = this.userId;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';

    return retry(() => this.request<T>(`${endpoint}${queryString}`, { method: 'GET' }));
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return retry(() =>
      this.request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      })
    );
  }

  async patch<T = any>(endpoint: string, data: any): Promise<T> {
    return retry(() =>
      this.request<T>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

