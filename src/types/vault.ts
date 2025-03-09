/**
 *
 * A vault is a folder that the user chooses to store their content in this application.
 * The vault stores configuration files for the application and other files that can be
 * managed by the application, the user and the LLM.
 */

export interface Vault {
  id: string;
  name: string;
  path: string;
}

export interface VaultConfig {
  // for now, nothing
}

export interface ConfiguredVault extends Vault {
  config: VaultConfig;
}

export interface ConfiguredVaults {
  [key: string]: ConfiguredVault;
}

export type ConfiguredVaultList = ConfiguredVault[];
