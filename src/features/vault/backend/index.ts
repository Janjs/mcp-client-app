/**
 * Public API for the vault feature in the main process
 */
import { BrowserWindow } from "electron";
import { AppModule } from "@backend/types";
import { removeWindowVaultAssociation } from "./window-vault-manager";
import {
  setupVaultIpcHandlers,
  removeVaultIpcHandlers,
} from "./vault-ipc-handler";
import {
  setupAllVaultsSubscription,
  removeAllVaultsSubscription,
} from "./subscriptions/allVaults";

export {
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

    setupAllVaultsSubscription();
  },

  cleanupModule: () => {
    console.log("Cleaning up Vault module");
    removeVaultIpcHandlers();
    removeAllVaultsSubscription();
  },
};
