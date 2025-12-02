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

  const fetchProfile = useCallback(async () => {
    if (!publicKey || !connected) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Set user ID for API requests
      apiClient.setUserId(publicKey.toString());
      
      const result = await notificationApi.getProfile();
      
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError(result.error?.message || 'Failed to load profile');
      }
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Poll every 5 seconds for real-time updates (e.g., Telegram linking)
  useEffect(() => {
    if (!connected || !publicKey) return;

    const interval = setInterval(() => {
      fetchProfile();
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, publicKey, fetchProfile]);

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
  };
}

