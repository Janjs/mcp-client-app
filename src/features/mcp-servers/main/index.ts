/**
 * Export MCP servers functionality for use in the main process
 */
import { BrowserWindow } from "electron";
import { AppModule } from "../../../main/types";
import {
  setupMcpServersIpcHandlers,
  removeMcpServersIpcHandlers,
} from "./mcp-servers-ipc-handler";
import {
  setupMcpConnectionIpcHandlers,
  removeMcpConnectionIpcHandlers,
} from "./mcp-connection-ipc-handler";
import { initMcpServersService } from "../services/mcp-servers-service";
/**
 * MCP Servers Module implementation
 */
export const McpServersModule: AppModule = {
  name: "McpServers",

  setupWindow: (_window: BrowserWindow) => {
    // No window-specific setup needed for MCP servers
    initMcpServersService(_window.id);
  },

  cleanupWindow: (_window: BrowserWindow) => {
    // No window-specific cleanup needed for MCP servers
  },

  setupModule: () => {
    console.log("Setting up McpServers module");
    setupMcpServersIpcHandlers();
    setupMcpConnectionIpcHandlers();
  },

  cleanupModule: () => {
    console.log("Cleaning up McpServers module");
    removeMcpServersIpcHandlers();
    removeMcpConnectionIpcHandlers();
  },
};
