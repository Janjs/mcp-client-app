import path from "path";
import { readJsonFile, updateJsonFile } from "@core/utils/json-file-utils";
import {
  modelRegistry,
  ConfiguredProvider,
  ModelRegistry,
  configuredProvider,
} from "@features/models/types/models";

// Cache keys for models operations
export const MODELS_CACHE_KEYS = {
  MODELS_REGISTRY: "models-registry",
};

/**
 * Path where model configurations are stored in vault
 * @param vaultPath Path to the vault
 * @returns Path to models.json in the vault config folder
 */
export function getModelsConfigPath(vaultPath: string): string {
  return path.join(vaultPath, ".vault", "models.json");
}

/**
 * Initialize the models service by registering cache queries
 * @param vaultPath Path to the current vault
 */
export function initModelsService(): void {
  // Register the models registry query
}

/**
 * Read models registry from the vault config folder
 * @param vaultPath Path to the current vault
 * @returns The models registry
 */
export async function getModelsRegistry(
  vaultPath: string,
): Promise<ModelRegistry> {
  const configPath = getModelsConfigPath(vaultPath);

  try {
    // Read and parse the configuration file
    const data = await readJsonFile(configPath, modelRegistry, {
      providers: [],
      models: [],
    });

    console.log("Models registry:", data);

    // Validate the data against our schema
    return data;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      // File doesn't exist, return default empty registry
      return { providers: [], models: [] };
    }

    console.error("Error reading models registry:", error);
    // Return default empty registry on any error
    return { providers: [], models: [] };
  }
}

/**
 * Save models registry to the vault config folder
 * @param vaultPath Path to the current vault
 * @param registry The models registry to save
 */
export async function saveModelsRegistry(
  vaultPath: string,
  registry: ModelRegistry,
): Promise<boolean> {
  const configPath = getModelsConfigPath(vaultPath);

  try {
    await updateJsonFile(configPath, () => registry, modelRegistry, {
      providers: [],
      models: [],
    });

    return true;
  } catch (error) {
    console.error("Error saving models registry:", error);
    return false;
  }
}

/**
 * Get provider settings from the registry
 * @param vaultPath Path to the current vault
 * @returns List of provider settings
 */
export async function getProviders(
  vaultPath: string,
): Promise<ConfiguredProvider[]> {
  const registry = await getModelsRegistry(vaultPath);

  return registry.providers;
}

/**
 * Add a new provider with settings
 * @param vaultPath Path to the current vault
 * @param settings Provider settings to add
 * @returns True if successful, false otherwise
 */
export async function addProvider(
  vaultPath: string,
  settings: ConfiguredProvider,
): Promise<boolean> {
  try {
    const registry = await getModelsRegistry(vaultPath);

    // Validate the settings
    const validatedSettings = configuredProvider.parse(settings);

    // Check if provider already exists
    const existingIndex = registry.providers.findIndex(
      (p) => p.provider === validatedSettings.provider,
    );

    if (existingIndex >= 0) {
      // Provider already exists, update its settings
      registry.providers[existingIndex] = {
        provider: validatedSettings.provider,
        settings: validatedSettings.settings,
      };
    } else {
      // Add new provider
      registry.providers.push({
        provider: validatedSettings.provider,
        settings: validatedSettings.settings,
      });
    }

    // Save the updated registry
    return await saveModelsRegistry(vaultPath, registry);
  } catch (error) {
    console.error("Error adding provider:", error);
    return false;
  }
}

/**
 * Update provider settings
 * @param vaultPath Path to the current vault
 * @param provider Provider to update
 * @param settings Updated settings
 * @returns True if successful, false otherwise
 */
export async function updateProviderSettings(
  vaultPath: string,
  providerName: string,
  settings: ConfiguredProvider,
): Promise<boolean> {
  try {
    const registry = await getModelsRegistry(vaultPath);

    // Validate the settings
    const validatedSettings = configuredProvider.parse(settings);

    // Find the provider to update
    const existingIndex = registry.providers.findIndex(
      (p) => p.provider === providerName,
    );

    if (existingIndex < 0) {
      // Provider doesn't exist
      return false;
    }

    // Update the provider
    registry.providers[existingIndex] = {
      provider: validatedSettings.provider,
      settings: validatedSettings.settings,
    };

    // Save the updated registry
    return await saveModelsRegistry(vaultPath, registry);
  } catch (error) {
    console.error("Error updating provider settings:", error);
    return false;
  }
}

/**
 * Remove a provider
 * @param vaultPath Path to the current vault
 * @param provider Provider to remove
 * @returns True if successful, false otherwise
 */
export async function removeProvider(
  vaultPath: string,
  provider: ConfiguredProvider,
): Promise<boolean> {
  try {
    const registry = await getModelsRegistry(vaultPath);

    // Find the provider to remove
    const updatedProviders = registry.providers.filter(
      (p) => p.provider !== provider.provider,
    );

    // Save the updated registry
    return await saveModelsRegistry(vaultPath, {
      ...registry,
      providers: updatedProviders,
    });
  } catch (error) {
    console.error("Error removing provider:", error);
    return false;
  }
}
