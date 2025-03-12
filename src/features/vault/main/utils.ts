import { ConfiguredVaultSchema } from "@core/validation/schema";
import * as vaultManager from "./vault-manager";
import * as windowVaultManager from "./window-vault-manager";
import { z } from "zod";
/**
 * Gets the active vault for the current window
 * @param windowId The ID of the window (optional, will use first vault if not provided)
 * @returns The active vault or the first vault if none is active
 */
export async function getActiveVault(windowId: number) {
  const vaults = await vaultManager.getVaults();

  if (vaults.length === 0) {
    throw new Error("No vaults found");
  }

  // Try to get the active vault for this window
  const activeVault = windowVaultManager.getActiveVaultForWindow(
    windowId,
    vaults,
  );
  return activeVault ?? null;
}

/**
 * Get the active vault for an event
 * @param event The event
 * @returns The active vault or null if no vault is active
 */
export async function getVaultFromEvent(
  event: Electron.IpcMainInvokeEvent,
): Promise<z.infer<typeof ConfiguredVaultSchema> | null> {
  const vaults = await vaultManager.getVaults();
  return windowVaultManager.getActiveVaultFromEvent(event, vaults);
}
