import { getAllMcpServersQuery } from "../queries/getAllServers";
import { BrowserWindow } from "electron";
import { ConnectionStatus } from "../../types/connection";
import { ConfiguredVaultZ } from "@core/validation/schema";
import { getMcpConnectionService } from "../services/mcp-connection-service";

/**
 * Connects to all MCP servers in the active vault
 * @param options Options for the mutation
 * @returns Promise that resolves when all connections are established
 */
export async function connectVaultServersMutation(options: {
  window: BrowserWindow;
  vault: ConfiguredVaultZ;
  onStatusChange: (serverId: string, status: ConnectionStatus) => void;
}): Promise<void> {
  const { window, vault, onStatusChange } = options;

  // Get al l servers
  const servers = await getAllMcpServersQuery(vault);

  // Connect to all servers
  await getMcpConnectionService().connectToVaultServers(
    vault.id,
    window.id,
    Object.values(servers),
    onStatusChange,
  );
}
