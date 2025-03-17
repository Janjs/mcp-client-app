import { MCP_CONNECTION_CHANNELS } from "@features/mcp-servers/types/channels";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { ConnectionStatus, McpConnections } from "../types/connection";

export const mcpConnectionApi = {
  /**
   * Get the connection status for a server
   * @param serverId The ID of the server
   * @returns The connection status
   */
  getConnectionStatus: async (serverId: string) => {
    return await ipcRenderer.invoke(
      MCP_CONNECTION_CHANNELS.GET_CONNECTION_STATUS,
      serverId,
    );
  },

  /**
   * Get the tools for a server
   * @param serverId The ID of the server
   * @returns The tools
   */
  getServerTools: async (serverId: string) => {
    return await ipcRenderer.invoke(
      MCP_CONNECTION_CHANNELS.GET_SERVER_TOOLS,
      serverId,
    );
  },

  /**
   * Connect to a server
   * @param serverId The ID of the server
   * @returns The connection status
   */
  connectToServer: async (serverId: string) => {
    return await ipcRenderer.invoke(
      MCP_CONNECTION_CHANNELS.CONNECT_TO_SERVER,
      serverId,
    );
  },

  /**
   * Disconnect from a server
   * @param serverId The ID of the server
   * @returns The connection status
   */
  disconnectFromServer: async (serverId: string) => {
    return await ipcRenderer.invoke(
      MCP_CONNECTION_CHANNELS.DISCONNECT_FROM_SERVER,
      serverId,
    );
  },

  /**
   * Listen for connection status changes
   * @param callback The callback to call when the connection status changes
   * @returns A function to remove the listener
   */
  onConnectionStatusChange: (
    callback: (serverId: string, status: ConnectionStatus) => void,
  ) => {
    const eventCallback = (
      _event: IpcRendererEvent,
      { serverId, status }: { serverId: string; status: ConnectionStatus },
    ) => {
      console.log("Connection status changed", { serverId, status });
      callback(serverId, status);
    };
    console.log("setting up mcp connection listener (preload)");

    ipcRenderer.on(
      MCP_CONNECTION_CHANNELS.CONNECTION_STATUS_CHANGED,
      eventCallback,
    );

    return () => {
      ipcRenderer.removeListener(
        MCP_CONNECTION_CHANNELS.CONNECTION_STATUS_CHANGED,
        eventCallback,
      );
    };
  },

  /**
   * Connect to all servers for a vault
   * @returns The connection status
   */
  connectToVaultServers: async () => {
    return await ipcRenderer.invoke(
      MCP_CONNECTION_CHANNELS.CONNECT_VAULT_SERVERS,
    );
  },

  /**
   * Get all MCP connections
   * @returns Record of server ID to connection object
   */
  getMcpConnections: async (): Promise<McpConnections> => {
    return await ipcRenderer.invoke(
      MCP_CONNECTION_CHANNELS.GET_MCP_CONNECTIONS,
    );
  },
};

export type McpConnectionAPI = typeof mcpConnectionApi;
