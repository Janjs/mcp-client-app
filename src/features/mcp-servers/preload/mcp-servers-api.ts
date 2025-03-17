import { ipcRenderer } from "electron";
import { McpServerZ } from "../../../core/validation/mcp-servers-schema";
import { MCP_SERVERS_CHANNELS } from "../types/channels";

/**
 * MCP servers API to be exposed to the renderer process
 */
export const mcpServersApi = {
  /**
   * Get all MCP servers
   * @param forceRefresh Force a refresh from disk
   * @returns Record of server ID to server object
   */
  getMcpServers: async (
    forceRefresh = false,
  ): Promise<Record<string, McpServerZ>> => {
    try {
      return await ipcRenderer.invoke(
        MCP_SERVERS_CHANNELS.GET_MCP_SERVERS,
        forceRefresh,
      );
    } catch (error) {
      console.error("Failed to get MCP servers:", error);
      throw error;
    }
  },

  /**
   * Add a new MCP server
   * @param server The server to add
   * @returns True if successful, false otherwise
   */
  addMcpServer: async (server: McpServerZ): Promise<boolean> => {
    try {
      return await ipcRenderer.invoke(
        MCP_SERVERS_CHANNELS.ADD_MCP_SERVER,
        server,
      );
    } catch (error) {
      console.error("Failed to add MCP server:", error);
      throw error;
    }
  },

  /**
   * Update an existing MCP server
   * @param serverId The ID of the server to update
   * @param server The updated server
   * @returns True if successful, false otherwise
   */
  updateMcpServer: async (
    serverId: string,
    server: McpServerZ,
  ): Promise<boolean> => {
    try {
      return await ipcRenderer.invoke(
        MCP_SERVERS_CHANNELS.UPDATE_MCP_SERVER,
        serverId,
        server,
      );
    } catch (error) {
      console.error("Failed to update MCP server:", error);
      throw error;
    }
  },

  /**
   * Remove an MCP server
   * @param serverId The ID of the server to remove
   * @returns True if successful, false otherwise
   */
  removeMcpServer: async (serverId: string): Promise<boolean> => {
    try {
      return await ipcRenderer.invoke(
        MCP_SERVERS_CHANNELS.REMOVE_MCP_SERVER,
        serverId,
      );
    } catch (error) {
      console.error("Failed to remove MCP server:", error);
      throw error;
    }
  },
};

export type McpServersAPI = typeof mcpServersApi;
