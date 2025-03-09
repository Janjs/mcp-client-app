/**
 * Public API for the vault feature in the main process
 */

// Export the Zod-based implementation
export {
  getVaults,
  openVault,
  removeVault,
  listVaultFiles,
  updateVaultConfig,
} from "./vault-manager";

export { VAULT_CHANNELS, setupVaultIpcHandlers } from "./vault-ipc-handler";
