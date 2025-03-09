import { BrowserWindow } from 'electron';
import { ConfiguredVaultSchema } from '../../../core/validation/schema';
import { z } from 'zod';

/**
 * Map to track which vault is active in each window
 * Key: Window ID
 * Value: Vault ID
 */
const windowVaultMap = new Map<number, string>();

/**
 * Set the active vault for a specific window
 * @param windowId The ID of the window
 * @param vaultId The ID of the vault to set as active
 */
export function setActiveVaultForWindow(windowId: number, vaultId: string): void {
  windowVaultMap.set(windowId, vaultId);
  console.log(`Set active vault ${vaultId} for window ${windowId}`);
}

/**
 * Get the active vault ID for a specific window
 * @param windowId The ID of the window
 * @returns The ID of the active vault, or undefined if no vault is active
 */
export function getActiveVaultIdForWindow(windowId: number): string | undefined {
  return windowVaultMap.get(windowId);
}

/**
 * Get the active vault for a specific window
 * @param windowId The ID of the window
 * @param vaults List of all available vaults
 * @returns The active vault object, or undefined if no vault is active
 */
export function getActiveVaultForWindow(
  windowId: number,
  vaults: z.infer<typeof ConfiguredVaultSchema>[]
): z.infer<typeof ConfiguredVaultSchema> | undefined {
  const vaultId = getActiveVaultIdForWindow(windowId);
  if (!vaultId) return undefined;
  
  return vaults.find(vault => vault.id === vaultId);
}

/**
 * Get the active vault for a specific Electron event
 * @param event Electron IPC event
 * @param vaults List of all available vaults
 * @returns The active vault object, or undefined if no vault is active
 */
export function getActiveVaultFromEvent(
  event: Electron.IpcMainInvokeEvent,
  vaults: z.infer<typeof ConfiguredVaultSchema>[]
): z.infer<typeof ConfiguredVaultSchema> | undefined {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return undefined;
  
  return getActiveVaultForWindow(window.id, vaults);
}

/**
 * Remove the window-vault association when a window is closed
 * @param windowId The ID of the window to remove
 */
export function removeWindowVaultAssociation(windowId: number): void {
  windowVaultMap.delete(windowId);
  console.log(`Removed vault association for window ${windowId}`);
}

/**
 * Get all window-vault associations
 * @returns Map of window IDs to vault IDs
 */
export function getWindowVaultAssociations(): Map<number, string> {
  return new Map(windowVaultMap);
} 