import { BrowserWindow } from "electron";
import { ConfiguredVaultSchema } from "@core/validation/schema";
import { z } from "zod";

/**
 * Class that manages window-vault associations
 */
export class WindowVaultManager {
  /**
   * Map to track which vault is active in each window
   * Key: Window ID
   * Value: Vault ID
   */
  private windowVaultMap = new Map<number, string>();

  /**
   * Set the active vault for a specific window
   * @param windowId The ID of the window
   * @param vaultId The ID of the vault to set as active
   */
  setActiveVaultForWindow(windowId: number, vaultId: string): void {
    this.windowVaultMap.set(windowId, vaultId);
    console.log(`Set active vault ${vaultId} for window ${windowId}`);
  }

  /**
   * Get the active vault ID for a specific window
   * @param windowId The ID of the window
   * @returns The ID of the active vault, or undefined if no vault is active
   */
  getActiveVaultIdForWindow(windowId: number): string | undefined {
    return this.windowVaultMap.get(windowId);
  }

  /**
   * Get the active vault for a specific window
   * @param windowId The ID of the window
   * @param vaults List of all available vaults
   * @returns The active vault object, or undefined if no vault is active
   */
  getActiveVaultForWindow(
    windowId: number,
    vaults: z.infer<typeof ConfiguredVaultSchema>[],
  ): z.infer<typeof ConfiguredVaultSchema> | null {
    const vaultId = this.getActiveVaultIdForWindow(windowId);
    if (!vaultId) return null;

    return vaults.find((vault) => vault.id === vaultId) ?? null;
  }

  /**
   * Get the active vault for a specific Electron event
   * @param event Electron IPC event
   * @param vaults List of all available vaults
   * @returns The active vault object, or undefined if no vault is active
   */
  getActiveVaultFromEvent(
    event: Electron.IpcMainInvokeEvent,
    vaults: z.infer<typeof ConfiguredVaultSchema>[],
  ): z.infer<typeof ConfiguredVaultSchema> | null {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;

    return this.getActiveVaultForWindow(window.id, vaults);
  }

  /**
   * Remove the window-vault association when a window is closed
   * @param windowId The ID of the window to remove
   */
  removeWindowVaultAssociation(windowId: number): void {
    this.windowVaultMap.delete(windowId);
    console.log(`Removed vault association for window ${windowId}`);
  }

  /**
   * Get all window-vault associations
   * @returns Map of window IDs to vault IDs
   */
  getWindowVaultAssociations(): Map<number, string> {
    return new Map(this.windowVaultMap);
  }
}

// Singleton instance
let windowVaultManager: WindowVaultManager | null = null;

/**
 * Get the WindowVaultManager singleton instance
 * @returns WindowVaultManager instance
 */
export function getWindowVaultManager(): WindowVaultManager {
  if (!windowVaultManager) {
    windowVaultManager = new WindowVaultManager();
  }
  return windowVaultManager;
}
