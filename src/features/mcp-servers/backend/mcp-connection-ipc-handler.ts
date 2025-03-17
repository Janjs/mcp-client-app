import { ipcMain } from "electron";
import * as mcpConnectionManager from "./mcp-connection-manager";
import * as mcpServersService from "./mcp-servers-manager";
import { connectionStatus } from "../types/connection";
import { getEventContext } from "@core/events/handleEvent";

/**
 * IPC channel names for MCP connections
 */
export const MCP_CONNECTION_CHANNELS = {
  CONNECT_TO_SERVER: "mcp-connection:connectToServer",
  DISCONNECT_FROM_SERVER: "mcp-connection:disconnectFromServer",
  GET_CONNECTION_STATUS: "mcp-connection:getConnectionStatus",
  GET_SERVER_TOOLS: "mcp-connection:getServerTools",
  CONNECTION_STATUS_CHANGED: "mcp-connection:connectionStatusChanged",
  CONNECT_VAULT_SERVERS: "mcp-connection:connectVaultServers",
  GET_MCP_CONNECTIONS: "mcp-connection:getMcpConnections",
} as const;

/**
 * Setup IPC handlers for MCP connections
 */
export function setupMcpConnectionIpcHandlers(): void {
  ipcMain.handle(
    MCP_CONNECTION_CHANNELS.CONNECT_TO_SERVER,
    async (event, serverId: string) => {
      const { window, vault } = await getEventContext(event);
      const windowId = window.id;

      if (!vault) {
        throw new Error("No active vault found");
      }
      const server = await mcpServersService.getMcpServer(windowId, serverId);
      if (!server) {
        throw new Error(`Server with ID ${serverId} not found`);
      }

      return mcpConnectionManager.connectToServer(
        vault.id,
        windowId,
        server,
        (status) => {
          console.log("mcp connection status changed (single)", {
            serverId,
            status,
          });
          window.webContents.send(
            MCP_CONNECTION_CHANNELS.CONNECTION_STATUS_CHANGED,
            {
              serverId,
              status,
            },
          );
        },
      );
    },
  );

  ipcMain.handle(
    MCP_CONNECTION_CHANNELS.DISCONNECT_FROM_SERVER,
    async (event, serverId: string) => {
      const { window, windowId, vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No active vault found");
      }

      return mcpConnectionManager.disconnectFromServer(
        vault.id,
        serverId,
        windowId,
        (status) => {
          console.log("mcp connection status changed (disconnect)", {
            serverId,
            status,
          });
          window.webContents.send(
            MCP_CONNECTION_CHANNELS.CONNECTION_STATUS_CHANGED,
            {
              serverId,
              status,
            },
          );
        },
      );
    },
  );

  ipcMain.handle(
    MCP_CONNECTION_CHANNELS.GET_CONNECTION_STATUS,
    async (event, serverId: string) => {
      const { vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No active vault found");
      }

      return (
        mcpConnectionManager.getConnectionInfo(vault.id, serverId)?.status ??
        connectionStatus.Enum.DISCONNECTED
      );
    },
  );

  ipcMain.handle(
    MCP_CONNECTION_CHANNELS.GET_SERVER_TOOLS,
    async (event, serverId: string) => {
      const { vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No active vault found");
      }

      const info = mcpConnectionManager.getConnectionInfo(vault.id, serverId);
      if (!info) {
        throw new Error("No connection info found");
      }

      return info.tools ?? [];
    },
  );

  ipcMain.handle(
    MCP_CONNECTION_CHANNELS.CONNECT_VAULT_SERVERS,
    async (event) => {
      console.log("connecting vault servers");
      const { window, windowId, vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No active vault found");
      }

      const servers = await mcpServersService.getMcpServers(windowId);
      return mcpConnectionManager.connectToVaultServers(
        vault.id,
        windowId,
        Object.values(servers),
        (serverId, status) => {
          console.log("mcp connection status changed (all)", {
            serverId,
            status,
          });
          window.webContents.send(
            MCP_CONNECTION_CHANNELS.CONNECTION_STATUS_CHANGED,
            {
              serverId,
              status,
            },
          );
        },
      );
    },
  );

  ipcMain.handle(MCP_CONNECTION_CHANNELS.GET_MCP_CONNECTIONS, async (event) => {
    const { vault } = await getEventContext(event);
    if (!vault) {
      throw new Error("No active vault found");
    }
    return mcpConnectionManager.getConnections(vault.id);
  });
}

export function removeMcpConnectionIpcHandlers(): void {
  ipcMain.removeHandler(MCP_CONNECTION_CHANNELS.CONNECT_TO_SERVER);
  ipcMain.removeHandler(MCP_CONNECTION_CHANNELS.DISCONNECT_FROM_SERVER);
  ipcMain.removeHandler(MCP_CONNECTION_CHANNELS.GET_CONNECTION_STATUS);
  ipcMain.removeHandler(MCP_CONNECTION_CHANNELS.GET_SERVER_TOOLS);
}
