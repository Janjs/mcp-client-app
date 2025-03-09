import { ipcRenderer } from 'electron';
import { ConfiguredVault, ConfiguredVaultList, VaultConfig } from '../types/vault';

export interface VaultAPI {
  /**
   * Get all vaults registered in the application
   */
  getVaults: () => Promise<ConfiguredVaultList>;
  
  /**
   * Create a new vault using the native file picker
   * @param isCreate Whether to create a new directory or select an existing one
   */
  createVault: (isCreate?: boolean) => Promise<ConfiguredVault | null>;
  
  /**
   * Remove a vault from the registry
   * @param vaultId The ID of the vault to remove
   */
  removeVault: (vaultId: string) => Promise<boolean>;
  
  /**
   * List files in a vault
   * @param vaultPath The path to the vault
   * @param subPath Optional subdirectory path within the vault
   */
  listVaultFiles: (
    vaultPath: string, 
    subPath?: string
  ) => Promise<{ name: string; path: string; isDirectory: boolean }[]>;
  
  /**
   * Update vault configuration
   * @param vaultId The ID of the vault to update
   * @param config The new configuration
   */
  updateVaultConfig: (vaultId: string, config: VaultConfig) => Promise<boolean>;
}

export const vaultAPI: VaultAPI = {
  getVaults: () => {
    return ipcRenderer.invoke('vault:get-vaults');
  },
  
  createVault: (isCreate = false) => {
    return ipcRenderer.invoke('vault:create-vault', isCreate);
  },
  
  removeVault: (vaultId) => {
    return ipcRenderer.invoke('vault:remove-vault', vaultId);
  },
  
  listVaultFiles: (vaultPath, subPath = '') => {
    return ipcRenderer.invoke('vault:list-files', vaultPath, subPath);
  },
  
  updateVaultConfig: (vaultId, config) => {
    return ipcRenderer.invoke('vault:update-config', vaultId, config);
  }
}; 