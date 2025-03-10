import { BrowserWindow, ipcMain } from "electron";
import * as mcpConnectionManager from "./mcp-connection-manager";
import * as mcpServersService from "./mcp-servers-manager";
import { getActiveVaultFromEvent } from "@features/vault/main/window-vault-manager";
import * as vaultService from "@features/vault/services/vault-service";
import { ConfiguredVaultSchema } from "@core/validation/schema";
import { z } from "zod";
import { connectionStatus } from "../types/connection";

export const MCP_CONNECTION_CHANNELS = {
  CONNECT_TO_SERVER: "mcp-connection:connectToServer",
  DISCONNECT_FROM_SERVER: "mcp-connection:disconnectFromServer",
  GET_CONNECTION_STATUS: "mcp-connection:getConnectionStatus",
  GET_SERVER_TOOLS: "mcp-connection:getServerTools",
  CONNECTION_STATUS_CHANGED: "mcp-connection:connectionStatusChanged",
  CONNECT_VAULT_SERVERS: "mcp-connection:connectVaultServers",
  GET_MCP_CONNECTIONS: "mcp-connection:getMcpConnections",
} as const;

function getWindowFromEvent(
  event: Electron.IpcMainInvokeEvent,
): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

function getWindowIdFromEvent(
  event: Electron.IpcMainInvokeEvent,
): number | null {
  const window = getWindowFromEvent(event);
  return window?.id ?? null;
}

async function getVaultFromEvent(
  event: Electron.IpcMainInvokeEvent,
): Promise<z.infer<typeof ConfiguredVaultSchema> | undefined> {
  const vaults = await vaultService.getVaults();
  return getActiveVaultFromEvent(event, vaults);
}

export function setupMcpConnectionIpcHandlers(): void {
  ipcMain.handle(
    MCP_CONNECTION_CHANNELS.CONNECT_TO_SERVER,
    async (event, serverId: string) => {
      const window = getWindowFromEvent(event);
      if (!window) {
        throw new Error("No window found");
      }
      const windowId = window.id;
      const vault = await getVaultFromEvent(event);
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
      const window = getWindowFromEvent(event);
      if (!window) {
        throw new Error("No window found");
      }
      const windowId = window.id;
      const vault = await getVaultFromEvent(event);
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
      const windowId = getWindowIdFromEvent(event);
      if (!windowId) {
        throw new Error("No window ID found");
      }
      const vault = await getVaultFromEvent(event);
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
      const windowId = getWindowIdFromEvent(event);
      if (!windowId) {
        throw new Error("No window ID found");
      }
      const vault = await getVaultFromEvent(event);
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
      const window = getWindowFromEvent(event);
      if (!window) {
        throw new Error("No window found");
      }
      const windowId = window.id;
      const vault = await getVaultFromEvent(event);
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
    const windowId = getWindowIdFromEvent(event);
    if (!windowId) {
      throw new Error("No window ID found");
    }
    const vault = await getVaultFromEvent(event);
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
