import { ipcMain, BrowserWindow, app } from "electron";
import { VAULT_CHANNELS } from "@features/vault/types";
import { getEventContext } from "@core/events/handleEvent";
import {
  getAllVaultsQuery,
  invalidateAllVaultsQuery,
} from "./queries/getAllVaults";
import {
  getVaultFilesQuery,
  invalidateVaultFilesQuery,
} from "./queries/getVaultFiles";
import { getFileTreeQuery, generateFileTreeQuery } from "./queries/getFileTree";
import { getActiveVaultQuery } from "./queries/getActiveVault";
import { openVaultMutation } from "./mutations/openVault";
import { removeVaultMutation } from "./mutations/removeVault";
import { updateVaultConfigMutation } from "./mutations/updateVaultConfig";
import { setActiveVaultMutation } from "./mutations/setActiveVault";

const router = ipcMain;

/**
 * Initialize IPC handlers for vault operations
 */
export function setupRouter(): void {
  // Get all vaults
  router.handle(
    VAULT_CHANNELS.GET_VAULTS,
    async (_event, forceRefresh = false) => {
      if (forceRefresh) {
        await invalidateAllVaultsQuery();
      }
      return await getAllVaultsQuery();
    },
  );

  // Open or create a vault
  router.handle(VAULT_CHANNELS.OPEN_VAULT, async (event) => {
    const { window } = await getEventContext(event);

    return openVaultMutation(window);
  });

  // Remove a vault
  router.handle(VAULT_CHANNELS.REMOVE_VAULT, async (_event, vaultId) => {
    const { window } = await getEventContext(_event);
    return removeVaultMutation({ vaultId, windowId: window.id });
  });

  // List files in a vault
  router.handle(
    VAULT_CHANNELS.LIST_FILES,
    async (_event, vaultId, vaultPath, subPath = "", forceRefresh = false) => {
      if (forceRefresh) {
        await invalidateVaultFilesQuery(vaultId, subPath);
      }
      return getVaultFilesQuery({ vaultId, vaultPath, subPath });
    },
  );

  // Update vault configuration
  router.handle(
    VAULT_CHANNELS.UPDATE_CONFIG,
    async (_event, vaultId, config) => {
      return updateVaultConfigMutation({ vaultId, config });
    },
  );

  // Read file tree
  router.handle(
    VAULT_CHANNELS.READ_FILE_TREE,
    async (_event, vaultPath: string) => {
      return getFileTreeQuery(vaultPath);
    },
  );

  // Generate file tree
  router.handle(
    VAULT_CHANNELS.GENERATE_FILE_TREE,
    async (_event, vaultPath: string) => {
      return generateFileTreeQuery(vaultPath);
    },
  );

  // Set active vault for a window
  router.handle(
    VAULT_CHANNELS.SET_ACTIVE_VAULT,
    async (event, vaultId: string) => {
      const { window } = await getEventContext(event);
      const vaults = await getAllVaultsQuery();

      return setActiveVaultMutation({
        windowId: window.id,
        vaultId,
        vaults,
      });
    },
  );

  // Get active vault for a window
  router.handle(VAULT_CHANNELS.GET_ACTIVE_VAULT, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      throw new Error("Failed to get window from event sender");
    }

    const vaults = await getAllVaultsQuery();
    return getActiveVaultQuery({ windowId: window.id, vaults });
  });

  // Invalidate vaults
  router.handle(VAULT_CHANNELS.INVALIDATE_VAULTS, async () => {
    console.log("invalidating vaults");
    await invalidateAllVaultsQuery();
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
export function removeRouter(): void {
  router.removeHandler(VAULT_CHANNELS.GET_VAULTS);
  router.removeHandler(VAULT_CHANNELS.OPEN_VAULT);
  router.removeHandler(VAULT_CHANNELS.REMOVE_VAULT);
  router.removeHandler(VAULT_CHANNELS.LIST_FILES);
  router.removeHandler(VAULT_CHANNELS.UPDATE_CONFIG);
  router.removeHandler(VAULT_CHANNELS.READ_FILE_TREE);
  router.removeHandler(VAULT_CHANNELS.GENERATE_FILE_TREE);
  router.removeHandler(VAULT_CHANNELS.SET_ACTIVE_VAULT);
  router.removeHandler(VAULT_CHANNELS.GET_ACTIVE_VAULT);
  router.removeHandler(VAULT_CHANNELS.INVALIDATE_VAULTS);
}
