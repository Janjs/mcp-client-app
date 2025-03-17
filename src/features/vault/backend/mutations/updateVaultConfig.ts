import { VaultConfigZ } from "@core/validation/schema";
import { getVaultFs } from "../services/vault-fs";
import { invalidateAllVaultsQuery } from "../queries/getAllVaults";

export const updateVaultConfigMutation = async ({
  vaultId,
  config,
}: {
  vaultId: string;
  config: VaultConfigZ;
}) => {
  const vaultFs = getVaultFs();
  const result = await vaultFs.updateVaultConfig(vaultId, config);

  if (result) {
    // Invalidate the vaults cache since a vault config was updated
    invalidateAllVaultsQuery();
  }

  return result;
};
