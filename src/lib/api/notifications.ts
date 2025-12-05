/**
 * Aegis Frontend - Notifications API
 * API functions for user notification settings
 */

import apiClient from './client';
import { ApiResponse } from '@/types/api';

export interface NotificationProfile {
  email: string | null;
  emailVerified: boolean;
  telegramChatId: string | null;
  telegramUsername: string | null;
  discordWebhook: string | null;
  notifyOnBlocked: boolean;
  notifyOnExecuted: boolean;
  notifyOnOverride: boolean;
}

export const notificationApi = {
  /**
   * Get user profile with notification settings
   */
  async getProfile(): Promise<ApiResponse<NotificationProfile>> {
    return apiClient.get('/api/user/profile');
  },

  /**
   * Update user profile (email, Discord webhook, notification preferences)
   */
  async updateProfile(
    data: Partial<NotificationProfile>
  ): Promise<ApiResponse<NotificationProfile>> {
    return apiClient.patch('/api/user/profile', data);
  },

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/user/email/send-verification');
  },

  /**
   * Send test email
   */
  async testEmail(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/user/email/test');
  },

  /**
   * Generate Telegram link token
   */
  async linkTelegram(): Promise<ApiResponse<{ botLink: string; expiresIn: number }>> {
    return apiClient.post('/api/user/telegram/link');
  },

  /**
   * Unlink Telegram account
   */
  async unlinkTelegram(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/user/telegram/unlink');
  },

  /**
   * Send test Telegram message
   */
  async testTelegram(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/user/telegram/test');
  },

  /**
   * Test Discord webhook
   */
  async testDiscord(webhookUrl: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/user/discord/test', { webhookUrl });
  },
};



