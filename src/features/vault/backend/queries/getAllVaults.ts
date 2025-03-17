import { queryOptions, UseQueryOptions } from "@tanstack/react-query";

import { appQueryClient } from "@core/queries/client";
import { getVaultFs } from "../services/vault-fs";
import { QueryOptions } from "@tanstack/react-query";
import { ConfiguredVaultZ } from "@core/validation/schema";

export const getAllVaultsQueryKey = () => ["vaults"];
const getAllVaultsQueryFn = () => {
  return getVaultFs().getVaults();
};
export const getAllVaultsQueryOptions = (ops?: QueryOptions) =>
  queryOptions({
    queryKey: getAllVaultsQueryKey(),
    staleTime: 30 * 1000, // 30 seconds
    queryFn: getAllVaultsQueryFn,
    ...(ops ?? {}),
  }) as UseQueryOptions<ConfiguredVaultZ[], Error>;

export const invalidateAllVaultsQuery = () =>
  appQueryClient.invalidateQueries({ queryKey: getAllVaultsQueryKey() });

/**
 * Get all vaults
 */
export const getAllVaultsQuery = (queryOptions?: QueryOptions) => {
  return appQueryClient.fetchQuery(getAllVaultsQueryOptions(queryOptions));
};
