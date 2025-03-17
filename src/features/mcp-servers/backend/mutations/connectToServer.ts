import { getServerQuery } from "../queries/getServer";
import { BrowserWindow } from "electron";
import { ConnectionStatus } from "../../types/connection";
import { getMcpConnectionService } from "../services/mcp-connection-service";
import { ConfiguredVaultZ } from "@core/validation/schema";

const mcpConnectionService = getMcpConnectionService();

/**
 * Connects to an MCP server
 * @param options Options for the mutation
 * @returns Promise that resolves when the connection is established
 */
export async function connectToServerMutation(options: {
  serverId: string;
  window: BrowserWindow;
  vault: ConfiguredVaultZ;
  onStatusChange: (status: ConnectionStatus) => void;
}): Promise<void> {
  const { serverId, window, vault, onStatusChange } = options;

  // Get the server
  const server = await getServerQuery({ serverId, vault });
  if (!server) {
    throw new Error(`Server with ID ${serverId} not found`);
  }

  // Connect to the server
  await mcpConnectionService.connectToServer(
    vault.id,
    window.id,
    server,
    onStatusChange,
  );
}
