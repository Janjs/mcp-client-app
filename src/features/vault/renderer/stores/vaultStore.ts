import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ConfiguredVault } from "../../types";

interface VaultState {
  // State
  activeVault: ConfiguredVault | null;

  // Actions
  setActiveVault: (vault: ConfiguredVault | null) => void;
  resetState: () => void;
}

export const useVaultStore = create<VaultState>()(
  devtools((set) => ({
    // Initial state
    activeVault: null,

    // Actions
    setActiveVault: (vault) => {
      set({ activeVault: vault });

      // Notify the main process about the active vault change
      if (vault) {
        window.api.vault
          .setActiveVault(vault.id)
          .then(() => {
            window.api.mcpConnection.connectToVaultServers();
          })
          .catch((error) =>
            console.error("Failed to set active vault in main process:", error),
          );
      }
    },
    resetState: () => set({ activeVault: null }),
  })),
);

/**
 * Get the active vault from the vault store
 */
export function useActiveVault() {
  return useVaultStore((state) => state.activeVault);
}
