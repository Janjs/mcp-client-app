import { appQueryClient } from "@core/queries/client";
import { getMcpServersService } from "../services/mcp-servers-service";

import { ConfiguredVaultZ } from "@core/validation/schema";
import { queryOptions } from "@tanstack/react-query";
const mcpServersService = getMcpServersService();

const getAllMcpServersQueryKey = () => ["all-mcp-servers"];

const getAllMcpServersQueryOptions = (vault: ConfiguredVaultZ) =>
  queryOptions({
    queryKey: getAllMcpServersQueryKey(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => mcpServersService.getMcpServers(vault),
  });

export const invalidateAllMcpServersQuery = () =>
  appQueryClient.invalidateQueries({ queryKey: getAllMcpServersQueryKey() });

/**
 * Gets all MCP servers for the active vault
 * @param vault The vault to get the servers for
 * @returns Record of server ID to server object
 */
export const getAllMcpServersQuery = (vault: ConfiguredVaultZ) =>
  appQueryClient.fetchQuery(getAllMcpServersQueryOptions(vault));
