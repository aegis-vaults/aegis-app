/**
 * Hook to fetch and manage user notification profile
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { notificationApi, type NotificationProfile } from '@/lib/api/notifications';
import apiClient from '@/lib/api/client';

export function useUserProfile() {
  const { publicKey, connected } = useWallet();
  const [profile, setProfile] = useState<NotificationProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldPoll, setShouldPoll] = useState(true);
  
  // Track if initial fetch has completed
  const initialFetchDone = useRef(false);

  const fetchProfile = useCallback(async (isInitialFetch = false) => {
    if (!publicKey || !connected) {
      setProfile(null);
      setError(null);
      setShouldPoll(true);
      initialFetchDone.current = false;
      return;
    }

    // Only show loading indicator on initial fetch, not polls
    if (isInitialFetch || !initialFetchDone.current) {
      setLoading(true);
    }
    setError(null);

    try {
      // Set user ID for API requests (wallet address)
      apiClient.setUserId(publicKey.toString());

      const result = await notificationApi.getProfile();

      if (result.success && result.data) {
        setProfile(result.data);
        setShouldPoll(true); // Resume polling on success
        initialFetchDone.current = true;
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
      // Only clear loading on initial fetch
      if (isInitialFetch || !initialFetchDone.current) {
        setLoading(false);
        initialFetchDone.current = true;
      }
    }
  }, [publicKey, connected]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    setShouldPoll(true); // Reset polling state when wallet changes
    initialFetchDone.current = false; // Reset initial fetch flag
    fetchProfile(true); // Initial fetch with loading state
  }, [fetchProfile]);

  // Poll every 5 seconds for real-time updates (e.g., Telegram linking)
  // Only poll if connected, has public key, and polling is enabled
  // These polls won't show the loading spinner
  useEffect(() => {
    if (!connected || !publicKey || !shouldPoll) return;

    const interval = setInterval(() => {
      fetchProfile(false); // Poll without loading state
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, publicKey, shouldPoll, fetchProfile]);

  return {
    profile,
    loading,
    error,
    refresh: () => fetchProfile(true), // Manual refresh shows loading
  };
}
