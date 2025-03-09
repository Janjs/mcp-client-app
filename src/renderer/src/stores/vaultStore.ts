import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface VaultState {
  // The ID of the currently active vault
  activeVaultId: string | null;
  
  // Set the active vault ID
  setActiveVaultId: (vaultId: string | null) => void;
  
  // Check if a specific vault is active
  isVaultActive: (vaultId: string) => boolean;
}

export const useVaultStore = create<VaultState>()(
  devtools(
    persist(
      (set, get) => ({
        activeVaultId: null,
        
        setActiveVaultId: (vaultId) => {
          set({ activeVaultId: vaultId });
          
          // Notify the main process about the change
          if (vaultId) {
            window.api.vault.setActiveVault(vaultId);
          }
        },
        
        isVaultActive: (vaultId) => {
          return get().activeVaultId === vaultId;
        },
      }),
      {
        name: 'vault-storage',
      }
    )
  )
); 