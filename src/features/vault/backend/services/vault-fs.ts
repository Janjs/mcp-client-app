import { dialog, BrowserWindow } from "electron";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { promises as fs } from "fs";
import { APP_DATA_PATH } from "@core/config/paths";
import {
  ConfiguredVaultZ,
  VaultConfigSchema,
  VaultFileSchema,
  VaultFileZ,
  VaultRegistrySchema,
} from "@core/validation/schema";
import { ConfiguredVaultSchema } from "@core/validation/schema";
import {
  readJsonFile,
  updateJsonFile,
  writeJsonFile,
} from "@core/utils/json-file-utils";

/**
 * Class that handles all file system operations for vaults
 */
export class VaultFs {
  private registryPath: string;

  /**
   * Initializes a new VaultFs instance
   * @param appDataPath Optional custom app data path. Defaults to APP_DATA_PATH
   */
  constructor(appDataPath: string = APP_DATA_PATH) {
    this.registryPath = path.join(appDataPath, "vault-registry.json");
  }

  /**
   * Gets all vaults registered in the application
   */
  async getVaults(): Promise<ConfiguredVaultZ[]> {
    try {
      const registry = await readJsonFile(
        this.registryPath,
        VaultRegistrySchema,
        { vaults: [] },
      );

      return registry.vaults;
    } catch (error) {
      console.error("Failed to get vaults:", error);
      throw error;
    }
  }

  /**
   * Opens a vault by selecting a folder or creating a new one
   * Initializes the vault if it doesn't exist yet
   * @param parentWindow The parent window for the dialog
   */
  async openVault(
    parentWindow: BrowserWindow,
  ): Promise<z.infer<typeof ConfiguredVaultSchema> | null> {
    try {
      const result = await dialog.showOpenDialog(parentWindow, {
        title: "Open or Create Vault",
        buttonLabel: "Select Folder",
        properties: ["openDirectory", "createDirectory", "promptToCreate"],
        message: "Select a folder to use as your vault",
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const vaultPath = result.filePaths[0];
      const vaultName = path.basename(vaultPath);

      // Check if this folder is already initialized as a vault
      const vaultConfigFolder = path.join(vaultPath, ".vault");
      const vaultConfigFile = path.join(vaultConfigFolder, "vault-config.json");

      // Create vault config folder if it doesn't exist
      await fs.mkdir(vaultConfigFolder, { recursive: true });

      // Try to read existing config or create new one
      const vaultConfig = await readJsonFile(
        vaultConfigFile,
        VaultConfigSchema,
        {},
      );

      // Generate a new vault ID if needed
      const vaultId = uuidv4();

      // Create the configured vault object
      const configuredVault = ConfiguredVaultSchema.parse({
        id: vaultId,
        name: vaultName,
        path: vaultPath,
        config: {
          ...vaultConfig,
          lastAccessed: new Date().toISOString(),
        },
      });

      // Save the vault config file
      await writeJsonFile(
        vaultConfigFile,
        configuredVault.config,
        VaultConfigSchema,
      );

      // Add vault to registry
      await this.addVaultToRegistry(configuredVault);

      return configuredVault;
    } catch (error) {
      console.error("Failed to open vault:", error);
      throw error;
    }
  }

  /**
   * Add a vault to the application registry
   */
  async addVaultToRegistry(
    vault: z.infer<typeof ConfiguredVaultSchema>,
  ): Promise<void> {
    // Update registry file
    await updateJsonFile(
      this.registryPath,
      (registry) => {
        // Check if vault already exists
        const existingIndex = registry.vaults.findIndex(
          (v) => v.id === vault.id,
        );

        if (existingIndex >= 0) {
          // Update existing vault
          registry.vaults[existingIndex] = vault;
        } else {
          // Add new vault
          registry.vaults.push(vault);
        }

        return registry;
      },
      VaultRegistrySchema,
      { vaults: [] },
    );
  }

  /**
   * Remove a vault from the registry
   */
  async removeVault(vaultId: string): Promise<boolean> {
    try {
      // Update registry file
      await updateJsonFile(
        this.registryPath,
        (registry) => {
          registry.vaults = registry.vaults.filter((v) => v.id !== vaultId);
          return registry;
        },
        VaultRegistrySchema,
        { vaults: [] },
      );

      return true;
    } catch (error) {
      console.error("Failed to remove vault:", error);
      return false;
    }
  }

  /**
   * List files in a vault
   */
  async listVaultFiles(
    vaultPath: string,
    subPath: string = "",
  ): Promise<VaultFileZ[]> {
    try {
      const fullPath = path.join(vaultPath, subPath);

      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      const files = entries.map((entry) => ({
        name: entry.name,
        path: path.join(subPath, entry.name),
        isDirectory: entry.isDirectory(),
      }));

      // Validate each file entry
      return files.map((file) => VaultFileSchema.parse(file));
    } catch (error) {
      console.error(
        `Failed to list files in vault path ${vaultPath}/${subPath}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update vault configuration
   */
  async updateVaultConfig(
    vaultId: string,
    config: z.infer<typeof VaultConfigSchema>,
  ): Promise<boolean> {
    try {
      // First validate the config
      const validatedConfig = VaultConfigSchema.parse(config);

      // Update registry
      const registry = await updateJsonFile(
        this.registryPath,
        (registry) => {
          const vaultIndex = registry.vaults.findIndex((v) => v.id === vaultId);

          if (vaultIndex < 0) {
            return registry; // Vault not found
          }

          // Update vault in registry
          registry.vaults[vaultIndex].config = validatedConfig;

          // Also update the vault's config file
          const vaultPath = registry.vaults[vaultIndex].path;
          const vaultConfigFile = path.join(
            vaultPath,
            ".vault",
            "vault-config.json",
          );

          // This is fire-and-forget
          writeJsonFile(
            vaultConfigFile,
            validatedConfig,
            VaultConfigSchema,
          ).catch((err) =>
            console.error(
              `Failed to update vault config file at ${vaultConfigFile}:`,
              err,
            ),
          );

          return registry;
        },
        VaultRegistrySchema,
        { vaults: [] },
      );

      const vaultFound = registry.vaults.some((v) => v.id === vaultId);
      return vaultFound;
    } catch (error) {
      console.error(
        `Failed to update vault config for vault ${vaultId}:`,
        error,
      );
      return false;
    }
  }
}

let vaultFs: VaultFs | null = null;
export function getVaultFs(): VaultFs {
  if (!vaultFs) {
    vaultFs = new VaultFs();
  }
  return vaultFs;
}
