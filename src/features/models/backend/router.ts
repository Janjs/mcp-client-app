import { ipcMain } from "electron";
import * as modelsService from "./services/models-service";
import { ConfiguredProvider, configuredProvider } from "../types/models";
import { getEventContext } from "@core/events/handleEvent";

/**
 * IPC channel names for Models operations
 */
export const MODELS_CHANNELS = {
  GET_PROVIDERS: "models:getProviders",
  ADD_PROVIDER: "models:addProvider",
  UPDATE_PROVIDER: "models:updateProvider",
  REMOVE_PROVIDER: "models:removeProvider",
};

const router = ipcMain;

/**
 * Initialize IPC handlers for Models operations
 */
export function setupRouter(): void {
  // Get all providers
  router.handle(MODELS_CHANNELS.GET_PROVIDERS, async (_event) => {
    const { vault } = await getEventContext(_event);
    if (!vault) {
      throw new Error("No active vault found");
    }

    return modelsService.getProviders(vault.path);
  });

  // Add a new provider
  router.handle(
    MODELS_CHANNELS.ADD_PROVIDER,
    async (_event, settings: ConfiguredProvider) => {
      const { vault } = await getEventContext(_event);
      if (!vault) {
        throw new Error("No active vault found");
      }

      // Validate provider settings
      const validatedSettings = configuredProvider.parse(settings);

      return modelsService.addProvider(vault.path, validatedSettings);
    },
  );

  // Update provider settings
  router.handle(
    MODELS_CHANNELS.UPDATE_PROVIDER,
    async (_event, providerName: string, settings: ConfiguredProvider) => {
      const { vault } = await getEventContext(_event);
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
  router.handle(
    MODELS_CHANNELS.REMOVE_PROVIDER,
    async (_event, provider: ConfiguredProvider) => {
      const { vault } = await getEventContext(_event);
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
export function removeRouter(): void {
  router.removeHandler(MODELS_CHANNELS.GET_PROVIDERS);
  router.removeHandler(MODELS_CHANNELS.ADD_PROVIDER);
  router.removeHandler(MODELS_CHANNELS.UPDATE_PROVIDER);
  router.removeHandler(MODELS_CHANNELS.REMOVE_PROVIDER);
}
