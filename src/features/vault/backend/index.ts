/**
 * Public API for the vault feature in the main process
 */
import { BrowserWindow } from "electron";
import { AppModule } from "@backend/types";
import { getWindowVaultManager } from "./services/window-vault-manager";
import { setupRouter, removeRouter } from "./router";
import {
  setupAllVaultsSubscription,
  removeAllVaultsSubscription,
} from "./subscriptions/allVaults";

export { setupRouter, removeRouter };

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
      getWindowVaultManager().removeWindowVaultAssociation(window.id);
    });
  },

  cleanupWindow: (_window: BrowserWindow) => {
    // No additional window cleanup needed
  },

  setupModule: () => {
    console.log("Setting up Vault module");
    setupRouter();

    // setupAllVaultsSubscription();
  },

  cleanupModule: () => {
    console.log("Cleaning up Vault module");
    removeRouter();
    // removeAllVaultsSubscription();
  },
};
