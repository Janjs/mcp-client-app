/**
 * A vault is a folder that the user chooses to store their content in this application.
 * The vault stores configuration files for the application and other files that can be
 * managed by the application, the user and the LLM.
 */

export interface Vault {
  id: string;
  name: string;
  path: string;
}

export interface McpServerSettings {
  url: string;
  apiKey?: string;
  isEnabled: boolean;
}

/**
 * Configuration for a vault, stored in .vault/vault-config.json
 */
export interface VaultConfig {
  /**
   * MCP server configuration for this vault
   */
  mcpServer?: McpServerSettings;
  
  /**
   * Default file extension for new files
   */
  defaultFileExtension?: string;
  
  /**
   * How often to sync files in minutes (0 = manual only)
   */
  syncIntervalMinutes?: number;
  
  /**
   * When the vault was last accessed
   */
  lastAccessed?: string;
  
  /**
   * User preferences for this vault
   */
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    fontSize?: number;
    [key: string]: unknown;
  };
}

export interface ConfiguredVault extends Vault {
  config: VaultConfig;
}

export interface ConfiguredVaults {
  [key: string]: ConfiguredVault;
}

export type ConfiguredVaultList = ConfiguredVault[];

/**
 * The app vault registry is a registry of all the vaults that the application has knowledge of.
 * This is stored as a configuration file in the application's data folder.
 */
export interface VaultRegistry {
  vaults: ConfiguredVault[];
} 