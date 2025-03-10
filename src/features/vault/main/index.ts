/**
 * Public API for the vault feature in the main process
 */
import { BrowserWindow } from "electron";
import { AppModule } from "../../../main/types";
import { removeWindowVaultAssociation } from "./window-vault-manager";
import {
  setupVaultIpcHandlers,
  removeVaultIpcHandlers,
} from "./vault-ipc-handler";

// Export the Zod-based implementation
export {
  getVaults,
  openVault,
  removeVault,
  listVaultFiles,
  updateVaultConfig,
} from "./vault-manager";

export {
  VAULT_CHANNELS,
  setupVaultIpcHandlers,
  removeVaultIpcHandlers,
} from "./vault-ipc-handler";

/**
 * Vault Module implementation
 */
export const VaultModule: AppModule = {
  name: "Vault",

  setupWindow: (window: BrowserWindow) => {
    // Setup window-specific behavior for vault
    window.on("closed", () => {
      console.log(
        `Window ${window.id} closed from VaultModule, cleaning up vault association`,
      );
      removeWindowVaultAssociation(window.id);
    });
  },

  cleanupWindow: (_window: BrowserWindow) => {
    // No additional window cleanup needed
    
  },

  setupModule: () => {
    console.log("Setting up Vault module");
    setupVaultIpcHandlers();
  },

  cleanupModule: () => {
    console.log("Cleaning up Vault module");
    removeVaultIpcHandlers();
  },
};
