import { ipcMain, BrowserWindow } from "electron";
import * as vaultService from "../services/vault-service";

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

    return vaultService.openVault(window);
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
}
