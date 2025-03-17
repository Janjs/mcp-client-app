import { ConnectionStatus, connectionStatus } from "../../types/connection";
import { getConnectionInfo } from "../services/mcp-connection-service";

import { ConfiguredVaultZ } from "@core/validation/schema";

/**
 * Gets the connection status for a specific server
 * @param options Options for the query
 * @returns The connection status
 */
export async function getConnectionStatusQuery(
  vault: ConfiguredVaultZ,
  serverId: string,
): Promise<ConnectionStatus> {
  // Get the connection status
  return (
    getConnectionInfo(vault.id, serverId)?.status ??
    connectionStatus.Enum.DISCONNECTED
  );
}
