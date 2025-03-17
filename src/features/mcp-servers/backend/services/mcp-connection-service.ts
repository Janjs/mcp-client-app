import { v4 as uuid } from "uuid";
import { McpServerZ } from "@core/validation/mcp-servers-schema";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  getDefaultEnvironment,
  StdioClientTransport,
  StdioServerParameters,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  ConnectionRegistry,
  ConnectionInfo,
  ConnectionStatus,
  connectionStatus,
  McpConnections,
} from "../../types/connection";

/**
 * Class that manages MCP connections
 */
export class McpConnectionService {
  /**
   * Registry to track connections by vault and server
   */
  private connectionRegistry: ConnectionRegistry = {};

  /**
   * Get a connection for a specific vault and server
   * @param vaultId The vault ID
   * @param serverId The server ID
   * @returns The connection object or undefined if not found
   */
  getConnection(vaultId: string, serverId: string) {
    return this.connectionRegistry[vaultId]?.[serverId];
  }

  /**
   * Get connection info for a specific vault and server
   * @param vaultId The vault ID
   * @param serverId The server ID
   * @returns The connection info or undefined if not found
   */
  getConnectionInfo(
    vaultId: string,
    serverId: string,
  ): ConnectionInfo | undefined {
    return this.connectionRegistry[vaultId]?.[serverId]?.info;
  }

  /**
   * Add a connection for a specific vault and server
   * @param vaultId The vault ID
   * @param serverId The server ID
   * @param windowId The window ID
   */
  addConnection(vaultId: string, serverId: string, windowId: number): void {
    this.connectionRegistry[vaultId] ??= {};
    this.connectionRegistry[vaultId][serverId] ??= {
      connectionId: uuid(),
      info: {
        status: connectionStatus.Enum.DISCONNECTED,
      },
      windowIds: new Set(),
      client: null,
    };
    this.connectionRegistry[vaultId][serverId].windowIds.add(windowId);
  }

  /**
   * Get the MCP client for a specific vault and server
   * @param vaultId The vault ID
   * @param serverId The server ID
   * @returns The MCP client
   */
  getClient(vaultId: string, serverId: string) {
    return this.connectionRegistry[vaultId][serverId].client;
  }

  /**
   * Set the MCP client for a specific vault and server
   * @param vaultId The vault ID
   * @param serverId The server ID
   * @param client The MCP client
   */
  setClient(vaultId: string, serverId: string, client: Client): void {
    if (!this.connectionRegistry[vaultId][serverId]) {
      throw new Error("No connection found");
    }
    this.connectionRegistry[vaultId][serverId].client = client;
  }

  /**
   * Update connection info for a specific vault and server
   * @param vaultId The vault ID
   * @param serverId The server ID
   * @param updateFn Function to update the connection info
   */
  updateConnectionInfo(
    vaultId: string,
    serverId: string,
    updateFn: (info: ConnectionInfo) => ConnectionInfo,
  ): void {
    if (!this.connectionRegistry[vaultId][serverId]) {
      throw new Error("No connection found");
    }
    const updatedInfo = updateFn(
      this.connectionRegistry[vaultId][serverId].info,
    );
    this.connectionRegistry[vaultId][serverId].info = {
      ...updatedInfo,
    };
  }

  /**
   * Connect to a server
   * @param vaultId The vault ID
   * @param windowId The window ID requesting the connection
   * @param server The server to connect to
   * @param onConnectionStatusChange A function to call when the connection status changes
   */
  async connectToServer(
    vaultId: string,
    windowId: number,
    server: McpServerZ,
    onConnectionStatusChange: (status: ConnectionStatus) => void,
  ): Promise<void> {
    const connectionInfo = this.getConnectionInfo(vaultId, server.id);
    if (!connectionInfo) {
      this.addConnection(vaultId, server.id, windowId);
    }

    this.connectionRegistry[vaultId][server.id].info.status =
      connectionStatus.Enum.CONNECTING;

    onConnectionStatusChange(connectionStatus.Enum.CONNECTING);

    try {
      if (server.type === "command") {
        await this.connectViaCommand(vaultId, server, onConnectionStatusChange);
      } else if (server.type === "sse") {
        await this.connectViaSSE(vaultId, server, onConnectionStatusChange);
      }
    } catch (error) {
      console.error(`Error connecting to server ${server.id}`, error);
      this.updateConnectionInfo(vaultId, server.id, (info) => ({
        ...info,
        status: connectionStatus.Enum.ERROR,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      onConnectionStatusChange(connectionStatus.Enum.ERROR);
    }
  }

  /**
   * Connect to a server via command
   * @param vaultId The vault ID
   * @param server The server to connect to
   * @param onConnectionStatusChange A function to call when the connection status changes
   */
  private async connectViaCommand(
    vaultId: string,
    server: McpServerZ,
    onConnectionStatusChange: (status: ConnectionStatus) => void,
  ): Promise<void> {
    const connectionInfo = this.getConnectionInfo(vaultId, server.id);
    if (!connectionInfo) {
      throw new Error("No connection found");
    }
    if (server.type !== "command") {
      throw new Error("Server is not a command server");
    }

    const [command, ...args] = server.config.command.split(" ");
    const env = server.config.env || {};
    const shouldAddEnv = Object.keys(env).length > 0;

    const defaultEnv = getDefaultEnvironment();

    const transportConfig: StdioServerParameters = {
      command,
      args,
      env: shouldAddEnv ? { ...defaultEnv, ...env } : defaultEnv,
    };

    const transport = new StdioClientTransport(transportConfig);

    const client = new Client({
      name: "mcp-client",
      version: "0.0.1",
    });

    // Connect the client to the transport
    await client.connect(transport);

    // Set the client in the connection registry
    this.setClient(vaultId, server.id, client);

    const toolsResult = await client.listTools();
    console.log(`Server ${server.id} has ${toolsResult.tools.length} tools`, {
      tools: toolsResult.tools,
    });

    // Update the info to list the tools
    this.updateConnectionInfo(vaultId, server.id, (info) => ({
      ...info,
      tools: toolsResult.tools,
      status: connectionStatus.Enum.CONNECTED,
    }));

    onConnectionStatusChange(connectionStatus.Enum.CONNECTED);
  }

  /**
   * Connect to a server via SSE
   * @param vaultId The vault ID
   * @param server The server to connect to
   * @param onConnectionStatusChange A function to call when the connection status changes
   */
  private async connectViaSSE(
    vaultId: string,
    server: McpServerZ,
    onConnectionStatusChange: (status: ConnectionStatus) => void,
  ): Promise<void> {
    const connectionInfo = this.getConnectionInfo(vaultId, server.id);
    if (!connectionInfo) {
      throw new Error("No connection found");
    }

    // TODO: implement SSE connection
    onConnectionStatusChange(connectionStatus.Enum.CONNECTED);
  }

  /**
   * Automatically connect to all servers for a vault
   * @param vaultId The vault ID
   * @param windowId The window ID requesting the connections
   * @param servers The servers to connect to
   * @param onConnectionStatusChange A function to call when the connection status changes
   */
  async connectToVaultServers(
    vaultId: string,
    windowId: number,
    servers: McpServerZ[],
    onConnectionStatusChange: (
      serverId: string,
      status: ConnectionStatus,
    ) => void,
  ): Promise<void> {
    const connectionPromises = servers.map((server) => {
      const connectionInfo = this.getConnectionInfo(vaultId, server.id);
      if (connectionInfo?.status === connectionStatus.Enum.CONNECTED) {
        this.addConnection(vaultId, server.id, windowId);
        return Promise.resolve();
      }
      return this.connectToServer(vaultId, windowId, server, (status) => {
        onConnectionStatusChange(server.id, status);
      });
    });

    await Promise.allSettled(connectionPromises);
  }

  /**
   * Disconnect from a specific server
   * @param vaultId The vault ID
   * @param serverId The server ID
   * @param windowId The window ID requesting disconnection
   * @param onConnectionStatusChange A function to call when the connection status changes
   */
  async disconnectFromServer(
    vaultId: string,
    serverId: string,
    windowId: number,
    onConnectionStatusChange: (status: ConnectionStatus) => void,
  ): Promise<void> {
    const connection = this.getConnection(vaultId, serverId);
    if (!connection) {
      throw new Error("No connection found");
    }

    connection.windowIds.delete(windowId);

    if (connection.windowIds.size === 0) {
      console.log(`Disconnecting from server ${serverId}`);
      this.updateConnectionInfo(vaultId, serverId, (info) => ({
        ...info,
        status: connectionStatus.Enum.DISCONNECTING,
      }));
      onConnectionStatusChange(connectionStatus.Enum.DISCONNECTING);

      try {
        if (connection.client) {
          console.log(`Closing client for server ${serverId}`);
          await connection.client.close();
          connection.client = null;

          this.updateConnectionInfo(vaultId, serverId, (info) => ({
            ...info,
            status: connectionStatus.Enum.DISCONNECTED,
          }));
          onConnectionStatusChange(connectionStatus.Enum.DISCONNECTED);
          console.log(`Disconnected from server ${serverId}`);
        }
      } catch (error) {
        console.error(`Error disconnecting from server ${serverId}`, error);
        this.updateConnectionInfo(vaultId, serverId, (info) => ({
          ...info,
          status: connectionStatus.Enum.ERROR,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        onConnectionStatusChange(connectionStatus.Enum.ERROR);
      }
    }
  }

  /**
   * Get all connections for a vault
   * @param vaultId The vault ID
   * @returns Array of connections
   */
  getConnections(vaultId: string): McpConnections {
    const connections = this.connectionRegistry[vaultId];
    return Object.entries(connections ?? {}).map(([serverId, connection]) => {
      return {
        serverId,
        info: connection.info,
      };
    });
  }
}

// Singleton instance
let mcpConnectionService: McpConnectionService | null = null;

/**
 * Get the McpConnectionService singleton instance
 * @returns McpConnectionService instance
 */
export function getMcpConnectionService(): McpConnectionService {
  if (!mcpConnectionService) {
    mcpConnectionService = new McpConnectionService();
  }
  return mcpConnectionService;
}

// Export the same interface as the old module for backward compatibility
export function getConnection(vaultId: string, serverId: string) {
  return getMcpConnectionService().getConnection(vaultId, serverId);
}

export function getConnectionInfo(
  vaultId: string,
  serverId: string,
): ConnectionInfo | undefined {
  return getMcpConnectionService().getConnectionInfo(vaultId, serverId);
}

export function addConnection(
  vaultId: string,
  serverId: string,
  windowId: number,
): void {
  getMcpConnectionService().addConnection(vaultId, serverId, windowId);
}

export function getClient(vaultId: string, serverId: string) {
  return getMcpConnectionService().getClient(vaultId, serverId);
}

export function updateConnectionInfo(
  vaultId: string,
  serverId: string,
  updateFn: (info: ConnectionInfo) => ConnectionInfo,
): void {
  getMcpConnectionService().updateConnectionInfo(vaultId, serverId, updateFn);
}

export async function connectToServer(
  vaultId: string,
  windowId: number,
  server: McpServerZ,
  onConnectionStatusChange: (status: ConnectionStatus) => void,
): Promise<void> {
  await getMcpConnectionService().connectToServer(
    vaultId,
    windowId,
    server,
    onConnectionStatusChange,
  );
}

export async function connectToVaultServers(
  vaultId: string,
  windowId: number,
  servers: McpServerZ[],
  onConnectionStatusChange: (
    serverId: string,
    status: ConnectionStatus,
  ) => void,
): Promise<void> {
  await getMcpConnectionService().connectToVaultServers(
    vaultId,
    windowId,
    servers,
    onConnectionStatusChange,
  );
}

export async function disconnectFromServer(
  vaultId: string,
  serverId: string,
  windowId: number,
  onConnectionStatusChange: (status: ConnectionStatus) => void,
): Promise<void> {
  await getMcpConnectionService().disconnectFromServer(
    vaultId,
    serverId,
    windowId,
    onConnectionStatusChange,
  );
}

export function getConnections(vaultId: string): McpConnections {
  return getMcpConnectionService().getConnections(vaultId);
}
