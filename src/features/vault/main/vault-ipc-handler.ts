import { ipcMain, BrowserWindow, app } from "electron";
import * as vaultService from "../services/vault-service";
import * as windowVaultManager from "./window-vault-manager";

/**
 * IPC channel names for vault operations
 */
export const VAULT_CHANNELS = {
  GET_VAULTS: "vault:getVaults",
  OPEN_VAULT: "vault:openVault",
  REMOVE_VAULT: "vault:removeVault",
  LIST_FILES: "vault:listFiles",
  UPDATE_CONFIG: "vault:updateConfig",
  READ_FILE_TREE: "vault:readFileTree",
  GENERATE_FILE_TREE: "vault:generateFileTree",
  SET_ACTIVE_VAULT: "vault:setActiveVault",
  GET_ACTIVE_VAULT: "vault:getActiveVault",
};

/**
 * Initialize IPC handlers for vault operations
 */
export function setupVaultIpcHandlers(): void {
  // Initialize the vault service
  vaultService.initVaultService();

  // Get all vaults
  ipcMain.handle(
    VAULT_CHANNELS.GET_VAULTS,
    async (_event, forceRefresh = false) => {
      return vaultService.getVaults({ forceRefresh });
    },
  );

  // Open or create a vault
  ipcMain.handle(VAULT_CHANNELS.OPEN_VAULT, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      throw new Error("Failed to get window from event sender");
    }

    const vault = await vaultService.openVault(window);

    // If a vault was successfully opened, set it as active for this window
    if (vault) {
      windowVaultManager.setActiveVaultForWindow(window.id, vault.id);
    }

    return vault;
  });

  // Remove a vault
  ipcMain.handle(VAULT_CHANNELS.REMOVE_VAULT, async (_event, vaultId) => {
    return vaultService.removeVault(vaultId);
  });

  // List files in a vault
  ipcMain.handle(
    VAULT_CHANNELS.LIST_FILES,
    async (_event, vaultId, vaultPath, subPath = "", forceRefresh = false) => {
      return vaultService.listVaultFiles(vaultId, vaultPath, subPath, {
        forceRefresh,
      });
    },
  );

  // Update vault configuration
  ipcMain.handle(
    VAULT_CHANNELS.UPDATE_CONFIG,
    async (_event, vaultId, config) => {
      return vaultService.updateVaultConfig(vaultId, config);
    },
  );

  // Read file tree
  ipcMain.handle(
    VAULT_CHANNELS.READ_FILE_TREE,
    async (_event, vaultPath: string) => {
      console.log("running the read file three command");
      return vaultService.readFileTree(vaultPath);
    },
  );

  // Generate file tree
  ipcMain.handle(
    VAULT_CHANNELS.GENERATE_FILE_TREE,
    async (_event, vaultPath: string) => {
      return vaultService.generateFileTree(vaultPath);
    },
  );

  // Set active vault for a window
  ipcMain.handle(
    VAULT_CHANNELS.SET_ACTIVE_VAULT,
    async (event, vaultId: string) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error("Failed to get window from event sender");
      }

      console.log("setting active vault for window", {
        windowId: window.id,
        vaultId,
      });

      // Verify that the vault exists
      const vaults = await vaultService.getVaults();
      const vaultExists = vaults.some((vault) => vault.id === vaultId);

      if (!vaultExists) {
        throw new Error(`Vault with ID ${vaultId} not found`);
      }

      windowVaultManager.setActiveVaultForWindow(window.id, vaultId);
      return true;
    },
  );

  // Get active vault for a window
  ipcMain.handle(VAULT_CHANNELS.GET_ACTIVE_VAULT, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      throw new Error("Failed to get window from event sender");
    }

    const vaults = await vaultService.getVaults();
    return windowVaultManager.getActiveVaultForWindow(window.id, vaults);
  });

  // Listen for window close events to clean up vault associations
  app.on("window-all-closed", () => {
    // Window-specific cleanup is handled in the main process index.ts
    // This is just a fallback for any missed window cleanup
    console.log("All windows closed, cleaning up vault associations");
  });
}

/**
 * Remove IPC handlers for vault operations
 */
export function removeVaultIpcHandlers(): void {
  ipcMain.removeHandler(VAULT_CHANNELS.GET_VAULTS);
  ipcMain.removeHandler(VAULT_CHANNELS.OPEN_VAULT);
  ipcMain.removeHandler(VAULT_CHANNELS.REMOVE_VAULT);
  ipcMain.removeHandler(VAULT_CHANNELS.LIST_FILES);
  ipcMain.removeHandler(VAULT_CHANNELS.UPDATE_CONFIG);
  ipcMain.removeHandler(VAULT_CHANNELS.READ_FILE_TREE);
  ipcMain.removeHandler(VAULT_CHANNELS.GENERATE_FILE_TREE);
  ipcMain.removeHandler(VAULT_CHANNELS.SET_ACTIVE_VAULT);
  ipcMain.removeHandler(VAULT_CHANNELS.GET_ACTIVE_VAULT);
}
