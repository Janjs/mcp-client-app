import { BrowserWindow } from "electron";
import { getVaultFs } from "../services/vault-fs";
import { appQueryClient } from "@core/queries/client";
import { getAllVaultsQueryKey } from "../queries/getAllVaults";
import { getActiveVaultQueryKey } from "../queries/getActiveVault";
import { getWindowVaultManager } from "../services/window-vault-manager";

export const openVaultMutation = async (window: BrowserWindow) => {
  const vaultFs = getVaultFs();
  const vault = await vaultFs.openVault(window);

  if (!vault) return null;

  // Set this vault as active for the window
  getWindowVaultManager().setActiveVaultForWindow(window.id, vault.id);

  // Invalidate relevant queries
  appQueryClient.invalidateQueries({
    queryKey: getAllVaultsQueryKey(),
  });
  appQueryClient.invalidateQueries({
    queryKey: getActiveVaultQueryKey(window.id),
  });

  return vault;
};
