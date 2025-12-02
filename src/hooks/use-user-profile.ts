/**
 * Hook to fetch and manage user notification profile
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { notificationApi, type NotificationProfile } from '@/lib/api/notifications';
import apiClient from '@/lib/api/client';

export function useUserProfile() {
  const { publicKey, connected } = useWallet();
  const [profile, setProfile] = useState<NotificationProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldPoll, setShouldPoll] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!publicKey || !connected) {
      setProfile(null);
      setError(null);
      setShouldPoll(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Set user ID for API requests (wallet address)
      apiClient.setUserId(publicKey.toString());

      const result = await notificationApi.getProfile();

      if (result.success && result.data) {
        setProfile(result.data);
        setShouldPoll(true); // Resume polling on success
      } else {
        const errorMessage = result.error?.message || 'Failed to load profile';
        setError(errorMessage);

        // Stop polling on authentication errors to prevent infinite retries
        if (result.error?.code === 'AUTHENTICATION_REQUIRED') {
          setShouldPoll(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      const errorMessage = err.message || 'Failed to load profile';
      setError(errorMessage);

      // Stop polling on authentication errors
      if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
        setShouldPoll(false);
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    setShouldPoll(true); // Reset polling state when wallet changes
    fetchProfile();
  }, [fetchProfile]);

  // Poll every 5 seconds for real-time updates (e.g., Telegram linking)
  // Only poll if connected, has public key, and polling is enabled
  useEffect(() => {
    if (!connected || !publicKey || !shouldPoll) return;

    const interval = setInterval(() => {
      fetchProfile();
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, publicKey, shouldPoll, fetchProfile]);

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
  };
}

