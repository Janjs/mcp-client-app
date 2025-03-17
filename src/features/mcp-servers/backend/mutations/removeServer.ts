import { ConfiguredVaultZ } from "@core/validation/schema";
import { getMcpServersService } from "../services/mcp-servers-service";
import { invalidateAllMcpServersQuery } from "../queries/getAllServers";

/**
 * Removes an MCP server
 * @param options Options for the mutation
 * @returns Whether the operation was successful
 */
export async function removeServerMutation(options: {
  serverId: string;
  vault: ConfiguredVaultZ;
}): Promise<boolean> {
  const { serverId, vault } = options;

  // Remove the server
  const result = await getMcpServersService().removeMcpServer(serverId, vault);

  // Invalidate the cache if successful
  if (result) {
    await invalidateAllMcpServersQuery();
  }

  return result;
}
