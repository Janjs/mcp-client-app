import { BrowserWindow } from "electron";
import { ConnectionStatus } from "../../types/connection";
import { ConfiguredVaultZ } from "@core/validation/schema";
import { getMcpConnectionService } from "../services/mcp-connection-service";

/**
 * Disconnects from an MCP server
 * @param options Options for the mutation
 * @returns Promise that resolves when disconnected
 */
export async function disconnectFromServerMutation(options: {
  serverId: string;
  window: BrowserWindow;
  vault: ConfiguredVaultZ;
  onStatusChange: (status: ConnectionStatus) => void;
}): Promise<void> {
  const { serverId, window, vault, onStatusChange } = options;

  // Disconnect from the server
  await getMcpConnectionService().disconnectFromServer(
    vault.id,
    serverId,
    window.id,
    onStatusChange,
  );
}
