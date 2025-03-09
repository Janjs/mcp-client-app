import { useState, useCallback } from "react";
import { ConfiguredVault, ConfiguredVaultList, VaultConfig } from "../../types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVaultStore } from "../stores/vaultStore";

// Query keys
const VAULT_KEYS = {
  all: ["vaults"] as const,
  lists: () => [...VAULT_KEYS.all, "list"] as const,
  active: () => [...VAULT_KEYS.all, "active"] as const,
};

/**
 * React hook for interacting with the vault API using TanStack Query
 */
export function useVaults() {
  const queryClient = useQueryClient();
  const { activeVault, setActiveVault } = useVaultStore();

  // Query to fetch vaults
  const {
    data: vaults = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: VAULT_KEYS.lists(),
    queryFn: async () => {
      const result = await window.api.vault.getVaults();

      console.log("vaults", result);

      // Set the first vault as active if there's no active vault
      if (result.length > 0 && !activeVault) {
        // We're assuming the vaults list is ordered with the most recent first
        setActiveVault(result[0]);
      }

      return result;
    },
  });

  // Mutation to open a vault
  const openVaultMutation = useMutation({
    mutationFn: async () => {
      return await window.api.vault.openVault();
    },
    onSuccess: (newVault) => {
      if (newVault) {
        // Invalidate vaults query to refetch the list
        queryClient.invalidateQueries({ queryKey: VAULT_KEYS.lists() });
        setActiveVault(newVault);
        return newVault;
      }
      return null;
    },
    onError: (err) => {
      console.error("Failed to open vault:", err);
      return null;
    },
  });

  // Mutation to remove a vault
  const removeVaultMutation = useMutation({
    mutationFn: async (vaultId: string) => {
      return await window.api.vault.removeVault(vaultId);
    },
    onSuccess: (result, vaultId) => {
      if (result) {
        // Update the active vault if the removed vault was active
        if (activeVault && activeVault.id === vaultId) {
          const remainingVaults = vaults.filter((v) => v.id !== vaultId);
          setActiveVault(
            remainingVaults.length > 0 ? remainingVaults[0] : null,
          );
        }

        // Invalidate vaults query to refetch the list
        queryClient.invalidateQueries({ queryKey: VAULT_KEYS.lists() });
      }
      return result;
    },
    onError: (err) => {
      console.error("Failed to remove vault:", err);
      return false;
    },
  });

  // Mutation to update vault configuration
  const updateVaultConfigMutation = useMutation({
    mutationFn: async ({
      vaultId,
      config,
    }: {
      vaultId: string;
      config: VaultConfig;
    }) => {
      return await window.api.vault.updateVaultConfig(vaultId, config);
    },
    onSuccess: (result, { vaultId, config }) => {
      if (result) {
        // Update the active vault if it's the one being updated
        if (activeVault && activeVault.id === vaultId) {
          setActiveVault((prev) => (prev ? { ...prev, config } : null));
        }

        // Invalidate vaults query to refetch the list
        queryClient.invalidateQueries({ queryKey: VAULT_KEYS.lists() });
      }
      return result;
    },
    onError: (err) => {
      console.error("Failed to update vault configuration:", err);
      return false;
    },
  });

  // Wrapper functions for simpler API
  const openVault = useCallback(async () => {
    return await openVaultMutation.mutateAsync();
  }, [openVaultMutation]);

  const removeVault = useCallback(
    async (vaultId: string) => {
      return await removeVaultMutation.mutateAsync(vaultId);
    },
    [removeVaultMutation],
  );

  const updateVaultConfig = useCallback(
    async (vaultId: string, config: VaultConfig) => {
      return await updateVaultConfigMutation.mutateAsync({ vaultId, config });
    },
    [updateVaultConfigMutation],
  );

  const refreshVaults = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: VAULT_KEYS.lists() });
  }, [queryClient]);

  return {
    vaults,
    loading,
    error,
    activeVault,
    setActiveVault,
    openVault,
    removeVault,
    updateVaultConfig,
    refreshVaults,
  };
}
