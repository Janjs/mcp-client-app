import { ConfiguredVaultZ } from "@core/validation/schema";
import {
  QueryOptions,
  queryOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { appQueryClient } from "@core/queries/client";
import { getWindowVaultManager } from "../services/window-vault-manager";
export const getActiveVaultQueryKey = (windowId: number) => [
  "activeVault",
  windowId,
];

export const getActiveVaultQueryOptions = (
  windowId: number,
  vaults: ConfiguredVaultZ[],
  ops?: QueryOptions,
) =>
  queryOptions({
    queryKey: getActiveVaultQueryKey(windowId),
    staleTime: 60 * 1000, // 1 minute
    queryFn: () =>
      getWindowVaultManager().getActiveVaultForWindow(windowId, vaults),
    ...(ops ?? {}),
  }) as UseQueryOptions<ConfiguredVaultZ, Error>;

export const invalidateActiveVaultQuery = (windowId: number) => {
  appQueryClient.invalidateQueries({
    queryKey: getActiveVaultQueryKey(windowId),
  });
};

export const getActiveVaultQuery = async ({
  windowId,
  vaults,
  queryOptions,
}: {
  windowId: number;
  vaults: ConfiguredVaultZ[];
  queryOptions?: QueryOptions;
}) => {
  return await appQueryClient.fetchQuery(
    getActiveVaultQueryOptions(windowId, vaults, queryOptions),
  );
};
