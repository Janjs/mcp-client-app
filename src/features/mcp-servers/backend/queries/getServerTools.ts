import { getConnectionInfo } from "../services/mcp-connection-service";

import { ConfiguredVaultZ } from "@core/validation/schema";
import { ConnectionInfo } from "@features/mcp-servers/types/connection";

/**
 * Gets the tools available from a specific MCP server
 * @param options Options for the query
 * @returns Array of tool objects
 */
export async function getServerToolsQuery(
  vault: ConfiguredVaultZ,
  serverId: string,
): Promise<ConnectionInfo["tools"]> {
  // Get the connection info
  const info = getConnectionInfo(vault.id, serverId);
  if (!info) {
    throw new Error("No connection info found");
  }

  // Return the tools
  return info.tools ?? [];
}
