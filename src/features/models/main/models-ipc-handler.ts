import { ipcMain } from "electron";
import * as modelsService from "../services/models-service";
import { ConfiguredProvider, configuredProvider } from "../types/models";
import { getWindowIdFromEvent } from "@core/utils/ipc";
import { getActiveVault } from "@features/vault/main/utils";

/**
 * IPC channel names for Models operations
 */
export const MODELS_CHANNELS = {
  GET_PROVIDERS: "models:getProviders",
  ADD_PROVIDER: "models:addProvider",
  UPDATE_PROVIDER: "models:updateProvider",
  REMOVE_PROVIDER: "models:removeProvider",
};

/**
 * Initialize IPC handlers for Models operations
 */
export function setupModelsIpcHandlers(): void {
  // Get all providers
  ipcMain.handle(MODELS_CHANNELS.GET_PROVIDERS, async (_event) => {
    const windowId = getWindowIdFromEvent(_event);
    if (!windowId) {
      throw new Error("No active window found");
    }
    const vault = await getActiveVault(windowId);
    if (!vault) {
      throw new Error("No active vault found");
    }

    return modelsService.getProviders(vault.path);
  });

  // Add a new provider
  ipcMain.handle(
    MODELS_CHANNELS.ADD_PROVIDER,
    async (_event, settings: ConfiguredProvider) => {
      const windowId = getWindowIdFromEvent(_event);
      if (!windowId) {
        throw new Error("No active window found");
      }
      const vault = await getActiveVault(windowId);
      if (!vault) {
        throw new Error("No active vault found");
      }

      // Validate provider settings
      const validatedSettings = configuredProvider.parse(settings);

      return modelsService.addProvider(vault.path, validatedSettings);
    },
  );

  // Update provider settings
  ipcMain.handle(
    MODELS_CHANNELS.UPDATE_PROVIDER,
    async (_event, providerName: string, settings: ConfiguredProvider) => {
      const windowId = getWindowIdFromEvent(_event);
      if (!windowId) {
        throw new Error("No active window found");
      }

      const vault = await getActiveVault(windowId);
      if (!vault) {
        throw new Error("No active vault found");
      }

      // Validate provider settings
      const validatedSettings = configuredProvider.parse(settings);

      return modelsService.updateProviderSettings(
        vault.path,
        providerName,
        validatedSettings,
      );
    },
  );

  // Remove a provider
  ipcMain.handle(
    MODELS_CHANNELS.REMOVE_PROVIDER,
    async (_event, provider: ConfiguredProvider) => {
      const windowId = getWindowIdFromEvent(_event);
      if (!windowId) {
        throw new Error("No active window found");
      }
      const vault = await getActiveVault(windowId);
      if (!vault) {
        throw new Error("No active vault found");
      }

      return modelsService.removeProvider(vault.path, provider);
    },
  );
}

/**
 * Remove IPC handlers for Models operations
 */
export function removeModelsIpcHandlers(): void {
  ipcMain.removeHandler(MODELS_CHANNELS.GET_PROVIDERS);
  ipcMain.removeHandler(MODELS_CHANNELS.ADD_PROVIDER);
  ipcMain.removeHandler(MODELS_CHANNELS.UPDATE_PROVIDER);
  ipcMain.removeHandler(MODELS_CHANNELS.REMOVE_PROVIDER);
}
