// Here we will create functions to represent queries that will be used by the vault feature backend

import { queryOptions, QueryOptions } from "@tanstack/react-query";
import { appQueryClient } from "@core/queries/client";
import { getVaultFs } from "../services/vault-fs";

/**
 * 1. Get all vaults
 * 2. List files
 * 3. Get active vault
 */

// List Vault Files
export const getVaultFilesQueryKey = (
  vaultId: string,
  subPath: string = "",
) => ["vaults", vaultId, "files", subPath];

type GetVaultFilesQueryOptionsParams = {
  vaultId: string;
  vaultPath: string;
  subPath: string;
};

/**
 * Get vault files query options
 */
export const getVaultFilesQueryOptions = (
  { vaultId, vaultPath, subPath }: GetVaultFilesQueryOptionsParams,
  ops?: QueryOptions,
) =>
  queryOptions({
    queryKey: getVaultFilesQueryKey(vaultId, subPath),
    staleTime: 30 * 1000, // 30 seconds
    queryFn: () => {
      console.log("getting vault files ================================");
      return getVaultFs().listVaultFiles(vaultPath, subPath);
    },
    ...(ops ?? {}),
  });

/**
 * Invalidate vault files query
 */
export const invalidateVaultFilesQuery = (
  vaultId: string,
  subPath: string = "",
) =>
  appQueryClient.invalidateQueries({
    queryKey: getVaultFilesQueryKey(vaultId, subPath),
  });

/**
 * Get vault files query
 */
export const getVaultFilesQuery = async (
  params: GetVaultFilesQueryOptionsParams,
  ops?: QueryOptions,
) => await appQueryClient.fetchQuery(getVaultFilesQueryOptions(params, ops));
