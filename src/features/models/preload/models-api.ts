import { ipcRenderer } from "electron";
import { MODELS_CHANNELS } from "@features/models/backend/router";
import { ConfiguredProvider } from "../types/models";

/**
 * Models API to be exposed to the renderer process
 */
export const modelsApi = {
  /**
   * Get all providers
   * @returns Array of provider settings
   */
  getProviders: async (): Promise<ConfiguredProvider[]> => {
    try {
      return await ipcRenderer.invoke(MODELS_CHANNELS.GET_PROVIDERS);
    } catch (error) {
      console.error("Failed to get providers:", error);
      throw error;
    }
  },

  /**
   * Add a new provider with settings
   * @param settings Provider settings to add
   * @returns True if successful, false otherwise
   */
  addProvider: async (settings: ConfiguredProvider): Promise<boolean> => {
    try {
      return await ipcRenderer.invoke(MODELS_CHANNELS.ADD_PROVIDER, settings);
    } catch (error) {
      console.error("Failed to add provider:", error);
      throw error;
    }
  },

  /**
   * Update provider settings
   * @param providerName Provider name to update
   * @param settings Updated settings
   * @returns True if successful, false otherwise
   */
  updateProvider: async (
    providerName: string,
    settings: ConfiguredProvider,
  ): Promise<boolean> => {
    try {
      return await ipcRenderer.invoke(
        MODELS_CHANNELS.UPDATE_PROVIDER,
        providerName,
        settings,
      );
    } catch (error) {
      console.error("Failed to update provider:", error);
      throw error;
    }
  },

  /**
   * Remove a provider
   * @param provider Provider to remove
   * @returns True if successful, false otherwise
   */
  removeProvider: async (provider: ConfiguredProvider): Promise<boolean> => {
    try {
      return await ipcRenderer.invoke(
        MODELS_CHANNELS.REMOVE_PROVIDER,
        provider,
      );
    } catch (error) {
      console.error("Failed to remove provider:", error);
      throw error;
    }
  },
};

export type ModelsAPI = typeof modelsApi;
