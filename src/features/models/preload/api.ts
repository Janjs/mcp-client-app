import { ipcRenderer } from "electron";
import { MODELS_CHANNELS } from "../main/models-ipc-handler";
import { ConfiguredProvider } from "../types/models";

/**
 * API for interacting with the models feature from the renderer process
 */
export const modelsApi = {
  /**
   * Get all configured providers
   * @returns Promise resolving to array of configured providers
   */
  getProviders: async (): Promise<ConfiguredProvider[]> => {
    return await ipcRenderer.invoke(MODELS_CHANNELS.GET_PROVIDERS);
  },

  /**
   * Add a new provider
   * @param provider The provider to add
   * @returns Promise resolving to boolean indicating success
   */
  addProvider: async (provider: ConfiguredProvider): Promise<boolean> => {
    return await ipcRenderer.invoke(MODELS_CHANNELS.ADD_PROVIDER, provider);
  },

  /**
   * Update an existing provider
   * @param providerName The name of the provider to update
   * @param provider The updated provider data
   * @returns Promise resolving to boolean indicating success
   */
  updateProvider: async (
    providerName: string,
    provider: ConfiguredProvider
  ): Promise<boolean> => {
    return await ipcRenderer.invoke(
      MODELS_CHANNELS.UPDATE_PROVIDER,
      providerName,
      provider
    );
  },
}; 