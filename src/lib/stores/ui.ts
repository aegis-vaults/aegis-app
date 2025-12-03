/**
 * Aegis Frontend - UI Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  vaultViewMode: 'grid' | 'list';
  setVaultViewMode: (mode: 'grid' | 'list') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      vaultViewMode: 'grid',
      setVaultViewMode: (mode) => set({ vaultViewMode: mode }),
    }),
    { 
      name: 'aegis-ui',
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed,
        vaultViewMode: state.vaultViewMode 
      })
    }
  )
);
