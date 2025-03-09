import { BrowserWindow } from "electron";
import { z } from "zod";
import { cacheManager } from "../../../core/cache/cache-manager";
import {
  ConfiguredVaultSchema,
  VaultConfigSchema,
  VaultFileSchema,
} from "../../../core/validation/schema";
import * as vaultManager from "../main/vault-manager";
import { FileTreeRoot } from "../preload/vault-api";
import * as fileTreeService from "../main/file-tree";
import * as yaml from "yaml";
// Cache keys for different vault operations
export const VAULT_CACHE_KEYS = {
  VAULTS: "vaults",
  VAULT_FILES: "vault-files:",
};

/**
 * Initialize the vault service by registering cache queries
 */
export function initVaultService(): void {
  // Register the vault list query
  cacheManager.registerQuery(
    VAULT_CACHE_KEYS.VAULTS,
    vaultManager.getVaults,
    z.array(ConfiguredVaultSchema),
  );
}

/**
 * Get all vaults with cache support
 */
export async function getVaults(
  options = { forceRefresh: false },
): Promise<z.infer<typeof ConfiguredVaultSchema>[]> {
  if (options.forceRefresh) {
    return cacheManager.refetchQuery(VAULT_CACHE_KEYS.VAULTS);
  }

  return cacheManager.query(VAULT_CACHE_KEYS.VAULTS);
}

/**
 * Open a vault with cache invalidation
 */
export async function openVault(
  parentWindow: BrowserWindow,
): Promise<z.infer<typeof ConfiguredVaultSchema> | null> {
  const vault = await vaultManager.openVault(parentWindow);

  if (vault) {
    // Invalidate the vaults cache since we added a new vault
    cacheManager.invalidateQueries(VAULT_CACHE_KEYS.VAULTS);
  }

  return vault;
}

/**
 * Remove a vault with cache invalidation
 */
export async function removeVault(vaultId: string): Promise<boolean> {
  const result = await vaultManager.removeVault(vaultId);

  if (result) {
    // Invalidate the vaults cache
    cacheManager.invalidateQueries(VAULT_CACHE_KEYS.VAULTS);

    // Invalidate any file listings for this vault
    cacheManager.invalidateQueries(`${VAULT_CACHE_KEYS.VAULT_FILES}${vaultId}`);
  }

  return result;
}

/**
 * List files in a vault with cache support
 */
export async function listVaultFiles(
  vaultId: string,
  vaultPath: string,
  subPath: string = "",
  options = { forceRefresh: false },
): Promise<z.infer<typeof VaultFileSchema>[]> {
  const cacheKey = `${VAULT_CACHE_KEYS.VAULT_FILES}${vaultId}:${subPath}`;

  // Register or update the query function for this specific path
  cacheManager.registerQuery(
    cacheKey,
    () => vaultManager.listVaultFiles(vaultPath, subPath),
    z.array(VaultFileSchema),
  );

  if (options.forceRefresh) {
    return cacheManager.refetchQuery(cacheKey);
  }

  return cacheManager.query(cacheKey);
}

/**
 * Update vault configuration with cache invalidation
 */
export async function updateVaultConfig(
  vaultId: string,
  config: z.infer<typeof VaultConfigSchema>,
): Promise<boolean> {
  // Validate the config
  const validatedConfig = VaultConfigSchema.parse(config);

  const result = await vaultManager.updateVaultConfig(vaultId, validatedConfig);

  if (result) {
    // Invalidate the vaults cache since a vault config was updated
    cacheManager.invalidateQueries(VAULT_CACHE_KEYS.VAULTS);
  }

  return result;
}

/**
 * Subscribe to vault list changes
 * @returns Unsubscribe function
 */
export function subscribeToVaults(callback: () => void): () => void {
  return cacheManager.subscribe(VAULT_CACHE_KEYS.VAULTS, callback);
}

/**
 * Subscribe to vault file list changes
 * @returns Unsubscribe function
 */
export function subscribeToVaultFiles(
  vaultId: string,
  subPath: string,
  callback: () => void,
): () => void {
  const cacheKey = `${VAULT_CACHE_KEYS.VAULT_FILES}${vaultId}:${subPath}`;
  return cacheManager.subscribe(cacheKey, callback);
}

const STALE_FILE_TREE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export async function readFileTree(
  vaultPath: string,
): Promise<FileTreeRoot | null> {
  try {
    const fileTree = await fileTreeService.readFileTree(vaultPath);
    console.log("loaded file tree", yaml.stringify(fileTree));

    const diff = fileTree?.generatedAt
      ? new Date().getTime() - new Date(fileTree.generatedAt).getTime()
      : 0;
    const isExpired = diff > STALE_FILE_TREE_THRESHOLD;
    isExpired && console.log("file tree is expired");

    if (!fileTree?.generatedAt || isExpired) {
      return await generateFileTree(vaultPath);
    }

    return fileTree;
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      console.log("File tree not found, generating...");
      // If the file tree doesn't exist, generate it
      return await generateFileTree(vaultPath);
    }

    console.error("Failed to read file tree:", error);
    return null;
  }
}

export async function generateFileTree(
  vaultPath: string,
): Promise<FileTreeRoot | null> {
  try {
    await fileTreeService.generateFileTree(vaultPath);
    return await readFileTree(vaultPath);
  } catch (error) {
    console.error("Failed to generate file tree:", error);
    return null;
  }
}
