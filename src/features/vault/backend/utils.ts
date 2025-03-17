import { ConfiguredVaultSchema } from "@core/validation/schema";
import * as windowVaultManager from "./window-vault-manager";
import { z } from "zod";
import { getActiveVaultQuery } from "./queries/getActiveVault";
import { getAllVaultsQuery } from "./queries/getAllVaults";
/**
 * Gets the active vault for the current window
 * @param windowId The ID of the window (optional, will use first vault if not provided)
 * @returns The active vault or the first vault if none is active
 */
export async function getActiveVault(windowId: number) {
  const allVaults = await getAllVaultsQuery();
  return getActiveVaultQuery({
    windowId,
    vaults: allVaults,
  });
}

/**
 * Get the active vault for an event
 * @param event The event
 * @returns The active vault or null if no vault is active
 */
export async function getVaultFromEvent(
  event: Electron.IpcMainInvokeEvent,
): Promise<z.infer<typeof ConfiguredVaultSchema> | null> {
  const vaults = await getAllVaultsQuery();
  return windowVaultManager.getActiveVaultFromEvent(event, vaults);
}
