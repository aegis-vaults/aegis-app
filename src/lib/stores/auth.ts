/**
 * Aegis Frontend - Auth Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  walletAddress: string | null;
  userId: string | null;
  setWallet: (address: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      walletAddress: null,
      userId: null,
      setWallet: (address) => set({ walletAddress: address }),
      clearAuth: () => set({ walletAddress: null, userId: null }),
    }),
    { name: 'aegis-auth' }
  )
);
