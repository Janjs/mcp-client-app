import { ipcMain, BrowserWindow } from "electron";
import * as mcpServersService from "../services/mcp-servers-service";
import { McpServerZ } from "../../../core/validation/mcp-servers-schema";

/**
 * IPC channel names for MCP server operations
 */
export const MCP_SERVERS_CHANNELS = {
  GET_MCP_SERVERS: "mcp-servers:getMcpServers",
  ADD_MCP_SERVER: "mcp-servers:addMcpServer",
  UPDATE_MCP_SERVER: "mcp-servers:updateMcpServer",
  REMOVE_MCP_SERVER: "mcp-servers:removeMcpServer",
};

/**
 * Helper function to get window ID from event
 */
function getWindowIdFromEvent(
  event: Electron.IpcMainInvokeEvent,
): number | undefined {
  const window = BrowserWindow.fromWebContents(event.sender);
  return window?.id;
}

/**
 * Initialize IPC handlers for MCP server operations
 */
export function setupMcpServersIpcHandlers(): void {
  // Get all MCP servers
  ipcMain.handle(
    MCP_SERVERS_CHANNELS.GET_MCP_SERVERS,
    async (event, forceRefresh = false) => {
      const windowId = getWindowIdFromEvent(event);
      if (!windowId) {
        throw new Error("No active window found");
      }

      console.log("getMcpServers", { forceRefresh, windowId });
      return mcpServersService.getMcpServers({ forceRefresh, windowId });
    },
  );

  // Add a new MCP server
  ipcMain.handle(
    MCP_SERVERS_CHANNELS.ADD_MCP_SERVER,
    async (event, server: McpServerZ) => {
      const windowId = getWindowIdFromEvent(event);
      if (!windowId) {
        throw new Error("No active window found");
      }
      return mcpServersService.addMcpServer(server, windowId);
    },
  );

  // Update an existing MCP server
  ipcMain.handle(
    MCP_SERVERS_CHANNELS.UPDATE_MCP_SERVER,
    async (event, serverId: string, server: McpServerZ) => {
      const windowId = getWindowIdFromEvent(event);
      if (!windowId) {
        throw new Error("No active window found");
      }
      return mcpServersService.updateMcpServer(serverId, server, windowId);
    },
  );

  // Remove an MCP server
  ipcMain.handle(
    MCP_SERVERS_CHANNELS.REMOVE_MCP_SERVER,
    async (event, serverId: string) => {
      const windowId = getWindowIdFromEvent(event);
      if (!windowId) {
        throw new Error("No active window found");
      }
      return mcpServersService.removeMcpServer(serverId, windowId);
    },
  );
}

/**
 * Remove IPC handlers for MCP server operations
 */
export function removeMcpServersIpcHandlers(): void {
  ipcMain.removeHandler(MCP_SERVERS_CHANNELS.GET_MCP_SERVERS);
  ipcMain.removeHandler(MCP_SERVERS_CHANNELS.ADD_MCP_SERVER);
  ipcMain.removeHandler(MCP_SERVERS_CHANNELS.UPDATE_MCP_SERVER);
  ipcMain.removeHandler(MCP_SERVERS_CHANNELS.REMOVE_MCP_SERVER);
}
