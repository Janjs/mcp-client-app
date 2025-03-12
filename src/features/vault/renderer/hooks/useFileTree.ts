import { useQuery } from "@tanstack/react-query";
import { useVaults } from "./useVaults";
import { FileTreeRoot } from "@features/vault/preload/vault-api";

export function useFileTree() {
  const { activeVault } = useVaults();

  return useQuery<FileTreeRoot | null>({
    queryKey: ["fileTree", activeVault?.path],
    queryFn: () => {
      if (!activeVault?.path) {
        throw new Error("No active vault path");
      }
      return window.api.vault.readFileTree(activeVault.path);
    },
    enabled: !!activeVault?.path,
  });
}
