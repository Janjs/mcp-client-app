import { v4 as uuid } from "uuid";
import { McpServerZ } from "@core/validation/mcp-servers-schema";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StdioClientTransport,
  StdioServerParameters,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  ConnectionRegistry,
  ConnectionInfo,
  ConnectionStatus,
  connectionStatus,
  McpConnections,
} from "../types/connection";

const connectionRegistry: ConnectionRegistry = {};

export function getConnection(vaultId: string, serverId: string) {
  return connectionRegistry[vaultId]?.[serverId];
}

export function getConnectionInfo(
  vaultId: string,
  serverId: string,
): ConnectionInfo | undefined {
  return connectionRegistry[vaultId]?.[serverId]?.info;
}

export function addConnection(
  vaultId: string,
  serverId: string,
  windowId: number,
) {
  connectionRegistry[vaultId] ??= {};
  connectionRegistry[vaultId][serverId] ??= {
    connectionId: uuid(),
    info: {
      status: connectionStatus.Enum.DISCONNECTED,
    },
    windowIds: new Set(),
    client: null,
  };
  connectionRegistry[vaultId][serverId].windowIds.add(windowId);
}

export function getClient(vaultId: string, serverId: string) {
  return connectionRegistry[vaultId][serverId].client;
}

export function setClient(vaultId: string, serverId: string, client: Client) {
  if (!connectionRegistry[vaultId][serverId]) {
    throw new Error("No connection found");
  }
  connectionRegistry[vaultId][serverId].client = client;
}

/**
 * Update the connection info for a server
 * @param vaultId The vault ID
 * @param serverId The server ID
 * @param updateFn A function to update the connection info
 */
export function updateConnectionInfo(
  vaultId: string,
  serverId: string,
  updateFn: (info: ConnectionInfo) => ConnectionInfo,
) {
  if (!connectionRegistry[vaultId][serverId]) {
    throw new Error("No connection found");
  }
  const updatedInfo = updateFn(connectionRegistry[vaultId][serverId].info);
  connectionRegistry[vaultId][serverId].info = {
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
export async function connectToServer(
  vaultId: string,
  windowId: number,
  server: McpServerZ,
  onConnectionStatusChange: (status: ConnectionStatus) => void,
) {
  // 1. Check if we already have a connection to this server/vault
  // 2. If not, create a new connection, adding the windowId to the set of windows using that connection
  // 3. Update the connection info to show that the connection is connecting
  // 4. Trigger an event to notify listeners that the connection is connecting
  // 5. Try to connect to the server
  // 6. If the connection succeeds, update the connection info to show that the connection is connected
  // 7. Trigger an event to notify listeners that the connection is connected
  // 8. If the connection fails, update the connection info to show that the connection is in error
  // 9. Trigger an event to notify listeners that the connection is in error

  const connectionInfo = getConnectionInfo(vaultId, server.id);
  if (!connectionInfo) {
    addConnection(vaultId, server.id, windowId);
  }

  connectionRegistry[vaultId][server.id].info.status =
    connectionStatus.Enum.CONNECTING;

  onConnectionStatusChange(connectionStatus.Enum.CONNECTING);

  try {
    // TODO: Actually connect to the server
    if (server.type === "command") {
      await connectViaCommand(vaultId, server, onConnectionStatusChange);
    } else if (server.type === "sse") {
      await connectViaSSE(vaultId, server, onConnectionStatusChange);
    }
  } catch (error) {
    updateConnectionInfo(vaultId, server.id, (info) => ({
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
async function connectViaCommand(
  vaultId: string,
  server: McpServerZ,
  onConnectionStatusChange: (status: ConnectionStatus) => void,
) {
  const connectionInfo = getConnectionInfo(vaultId, server.id);
  if (!connectionInfo) {
    throw new Error("No connection found");
  }
  if (server.type !== "command") {
    throw new Error("Server is not a command server");
  }

  const [command, ...args] = server.config.command.split(" ");

  const transportConfig: StdioServerParameters = {
    command,
    args,
  };

  const transport = new StdioClientTransport(transportConfig);

  const client = new Client({
    name: "mcp-client",
    version: "0.0.1",
  });

  // Connect the client to the transport
  await client.connect(transport);

  // Set the client in the connection registry
  setClient(vaultId, server.id, client);

  const toolsResult = await client.listTools();
  console.log(`Server ${server.id} has ${toolsResult.tools.length} tools`, {
    tools: toolsResult.tools,
  });

  // Update the info to list the tools
  updateConnectionInfo(vaultId, server.id, (info) => ({
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
function connectViaSSE(
  vaultId: string,
  server: McpServerZ,
  onConnectionStatusChange: (status: ConnectionStatus) => void,
) {
  const connectionInfo = getConnectionInfo(vaultId, server.id);
  if (!connectionInfo) {
    throw new Error("No connection found");
  }

  // TODO: implement SSE connection
  onConnectionStatusChange(connectionStatus.Enum.CONNECTED); // this is a lie, but right now we don't need to do anything
}

/**
 * Automatically connect to all servers for a vault
 * @param vaultId The vault ID
 * @param windowId The window ID requesting the connections
 * @returns Promise that resolves when all connection attempts are complete
 */
export async function connectToVaultServers(
  vaultId: string,
  windowId: number,
  servers: McpServerZ[],
  onConnectionStatusChange: (
    serverId: string,
    status: ConnectionStatus,
  ) => void,
) {
  const connectionPromises = servers.map((server) => {
    const connectionInfo = getConnectionInfo(vaultId, server.id);
    if (connectionInfo?.status === connectionStatus.Enum.CONNECTED) {
      addConnection(vaultId, server.id, windowId);
      return Promise.resolve();
    }
    return connectToServer(vaultId, windowId, server, (status) => {
      onConnectionStatusChange(server.id, status);
    });
  });

  await Promise.allSettled(connectionPromises);
}

/**
 * Disconnect a specific server connection
 * @param vaultId The vault ID
 * @param serverId The server ID
 * @param windowId The window ID requesting disconnection
 */
export async function disconnectFromServer(
  vaultId: string,
  serverId: string,
  windowId: number,
  onConnectionStatusChange: (status: ConnectionStatus) => void,
) {
  const connection = getConnection(vaultId, serverId);
  if (!connection) {
    throw new Error("No connection found");
  }

  connection.windowIds.delete(windowId);

  if (connection.windowIds.size === 0) {
    console.log(`Disconnecting from server ${serverId}`);
    updateConnectionInfo(vaultId, serverId, (info) => ({
      ...info,
      status: connectionStatus.Enum.DISCONNECTING,
    }));
    onConnectionStatusChange(connectionStatus.Enum.DISCONNECTING);

    try {
      if (connection.client) {
        console.log(`Closing client for server ${serverId}`);
        await connection.client.close();
        connection.client = null;

        updateConnectionInfo(vaultId, serverId, (info) => ({
          ...info,
          status: connectionStatus.Enum.DISCONNECTED,
        }));
        onConnectionStatusChange(connectionStatus.Enum.DISCONNECTED);
        console.log(`Disconnected from server ${serverId}`);
      }
    } catch (error) {
      console.error(`Error disconnecting from server ${serverId}`, error);
      updateConnectionInfo(vaultId, serverId, (info) => ({
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
 * @returns Record of server ID to connection object
 */
export function getConnections(vaultId: string): McpConnections {
  const connections = connectionRegistry[vaultId];
  return Object.entries(connections ?? {}).map(([serverId, connection]) => {
    return {
      serverId,
      info: connection.info,
    };
  });
}
