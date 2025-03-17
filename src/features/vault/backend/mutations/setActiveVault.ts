import { ConfiguredVaultZ } from "@core/validation/schema";
import * as windowVaultManager from "../window-vault-manager";
import { invalidateActiveVaultQuery } from "../queries/getActiveVault";

export const setActiveVaultMutation = async ({
  windowId,
  vaultId,
  vaults,
}: {
  windowId: number;
  vaultId: string;
  vaults: ConfiguredVaultZ[];
}) => {
  const vaultExists = vaults.some((vault) => vault.id === vaultId);

  if (!vaultExists) {
    throw new Error(`Vault with ID ${vaultId} not found`);
  }

  windowVaultManager.setActiveVaultForWindow(windowId, vaultId);

  invalidateActiveVaultQuery(windowId);

  return true;
};
