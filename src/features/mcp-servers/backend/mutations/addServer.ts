import { McpServerZ } from "@core/validation/mcp-servers-schema";

import { invalidateAllMcpServersQuery } from "../queries/getAllServers";

import { ConfiguredVaultZ } from "@core/validation/schema";
import { getMcpServersService } from "../services/mcp-servers-service";

/**
 * Adds a new MCP server
 * @param options Options for the mutation
 * @returns Whether the operation was successful
 */
export async function addServerMutation(
  server: McpServerZ,
  vault: ConfiguredVaultZ,
): Promise<boolean> {
  // Add the server
  const result = await getMcpServersService().addMcpServer(server, vault);

  // Invalidate the cache if successful
  if (result) {
    await invalidateAllMcpServersQuery();
  }

  return result;
}
