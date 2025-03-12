import { ipcRenderer } from "electron";
import { z } from "zod";
import {
  ConfiguredVaultSchema,
  VaultConfigSchema,
  VaultFileSchema,
} from "../../../core/validation/schema";
import { VAULT_CHANNELS } from "../main/vault-ipc-handler";

// Export types from Zod schemas
export type ConfiguredVault = z.infer<typeof ConfiguredVaultSchema>;
export type ConfiguredVaultList = ConfiguredVault[];
export type VaultConfig = z.infer<typeof VaultConfigSchema>;
export type VaultFile = z.infer<typeof VaultFileSchema>;

// File tree types
export interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export interface FileTreeRoot {
  tree: FileNode;
  generatedAt: string;
}

/**
 * API interface for vault management exposed to the renderer process
 */
export interface VaultAPI {
  /**
   * Get all vaults registered in the application
   * @param forceRefresh Whether to bypass cache and force a refresh
   */
  getVaults: (forceRefresh?: boolean) => Promise<ConfiguredVaultList>;

  /**
   * Open or create a vault using the native file picker
   * The system will initialize the vault if it's a new folder
   */
  openVault: () => Promise<ConfiguredVault | null>;

  /**
   * Remove a vault from the registry
   * @param vaultId The ID of the vault to remove
   */
  removeVault: (vaultId: string) => Promise<boolean>;

  /**
   * List files in a vault
   * @param vaultId The ID of the vault
   * @param vaultPath The path to the vault
   * @param subPath Optional subdirectory path within the vault
   * @param forceRefresh Whether to bypass cache and force a refresh
   */
  listVaultFiles: (
    vaultId: string,
    vaultPath: string,
    subPath?: string,
    forceRefresh?: boolean,
  ) => Promise<VaultFile[]>;

  /**
   * Update vault configuration
   * @param vaultId The ID of the vault to update
   * @param config The new configuration
   */
  updateVaultConfig: (vaultId: string, config: VaultConfig) => Promise<boolean>;

  /**
   * Read the file tree structure of a vault
   * @param vaultPath The path to the vault
   */
  readFileTree: (vaultPath: string) => Promise<FileTreeRoot | null>;

  /**
   * Generate the file tree structure of a vault
   * @param vaultPath The path to the vault
   */
  generateFileTree: (vaultPath: string) => Promise<FileTreeRoot | null>;

  /**
   * Set the active vault for the current window
   * @param vaultId The ID of the vault to set as active
   */
  setActiveVault: (vaultId: string) => Promise<boolean>;

  /**
   * Get the active vault for the current window
   */
  getActiveVault: () => Promise<ConfiguredVault | null>;
}

/**
 * Implementation of the vault API for the renderer process
 */
export const vaultAPI: VaultAPI = {
  getVaults: (forceRefresh = false) => {
    return ipcRenderer.invoke(VAULT_CHANNELS.GET_VAULTS, forceRefresh);
  },

  openVault: () => {
    return ipcRenderer.invoke(VAULT_CHANNELS.OPEN_VAULT);
  },

  removeVault: (vaultId) => {
    return ipcRenderer.invoke(VAULT_CHANNELS.REMOVE_VAULT, vaultId);
  },

  listVaultFiles: (vaultId, vaultPath, subPath = "", forceRefresh = false) => {
    return ipcRenderer.invoke(
      VAULT_CHANNELS.LIST_FILES,
      vaultId,
      vaultPath,
      subPath,
      forceRefresh,
    );
  },

  updateVaultConfig: (vaultId, config) => {
    return ipcRenderer.invoke(VAULT_CHANNELS.UPDATE_CONFIG, vaultId, config);
  },

  readFileTree: (vaultPath) => {
    return ipcRenderer.invoke(VAULT_CHANNELS.READ_FILE_TREE, vaultPath);
  },

  generateFileTree: (vaultPath) => {
    return ipcRenderer.invoke(VAULT_CHANNELS.GENERATE_FILE_TREE, vaultPath);
  },

  setActiveVault: async (vaultId) => {
    const result = await ipcRenderer.invoke(
      VAULT_CHANNELS.SET_ACTIVE_VAULT,
      vaultId,
    );
    return result;
  },

  getActiveVault: () => {
    return ipcRenderer.invoke(VAULT_CHANNELS.GET_ACTIVE_VAULT);
  },
};
