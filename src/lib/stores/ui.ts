/**
 * Aegis Frontend - UI Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  vaultViewMode: 'grid' | 'list';
  setVaultViewMode: (mode: 'grid' | 'list') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      vaultViewMode: 'grid',
      setVaultViewMode: (mode) => set({ vaultViewMode: mode }),
    }),
    { name: 'aegis-ui' }
  )
);
