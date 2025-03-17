import { appQueryClient } from "@core/queries/client";
import { invalidateAllVaultsQuery } from "../queries/getAllVaults";
import { getVaultFs } from "../services/vault-fs";
import { invalidateActiveVaultQuery } from "../queries/getActiveVault";

// Remove Vault Mutation
export const removeVaultMutation = async ({
  vaultId,
  windowId,
}: {
  vaultId: string;
  windowId: number;
}) => {
  const vaultFs = getVaultFs();
  const result = await vaultFs.removeVault(vaultId);

  if (result) {
    // Invalidate all affected queries
    invalidateAllVaultsQuery();

    invalidateActiveVaultQuery(windowId);

    // Also invalidate active vault queries for all windows that might have had this vault active
    appQueryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === "activeVault",
    });
  }

  return result;
};
