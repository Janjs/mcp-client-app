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
