import { create } from 'zustand'
import { ConfiguredVault } from '../../types'

interface VaultState {
  // State
  activeVault: ConfiguredVault | null
  
  // Actions
  setActiveVault: (vault: ConfiguredVault | null) => void
  resetState: () => void
}

export const useVaultStore = create<VaultState>()((set) => ({
  // Initial state
  activeVault: null,
  
  // Actions
  setActiveVault: (vault) => set({ activeVault: vault }),
  resetState: () => set({ activeVault: null }),
}))