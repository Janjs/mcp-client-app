import { McpConnections } from "../../types/connection";
import { getConnections } from "../services/mcp-connection-service";
import { ConfiguredVaultZ } from "@core/validation/schema";

/**
 * Gets all MCP connections for the active vault
 * @param options Options for the query
 * @returns Map of server IDs to connection info
 */
export async function getConnectionsQuery(
  vault: ConfiguredVaultZ,
): Promise<McpConnections> {
  // Get all connections for this vault
  return getConnections(vault.id);
}
