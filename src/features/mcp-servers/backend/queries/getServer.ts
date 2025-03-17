import { z } from "zod";
import { McpServerSchema } from "@core/validation/mcp-servers-schema";
import { getAllMcpServersQuery } from "./getAllServers";
import { ConfiguredVaultZ } from "@core/validation/schema";
/**
 * Gets a specific MCP server by ID
 * @param options Options for the query
 * @returns The MCP server or undefined if it doesn't exist
 */
export async function getServerQuery(options: {
  serverId: string;
  vault: ConfiguredVaultZ;
}): Promise<z.infer<typeof McpServerSchema> | undefined> {
  const { serverId, vault } = options;

  // Get all servers
  const servers = await getAllMcpServersQuery(vault);

  // Return the requested server if it exists
  return servers[serverId];
}
