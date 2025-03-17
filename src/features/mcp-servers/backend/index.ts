/**
 * Export MCP servers functionality for use in the main process
 */
import { BrowserWindow } from "electron";
import { AppModule } from "@backend/types";
import { removeRouter, setupRouter } from "./router";
/**
 * MCP Servers Module implementation
 */
export const McpServersModule: AppModule = {
  name: "McpServers",

  setupWindow: (_window: BrowserWindow) => {
    // No window-specific setup needed for MCP servers
  },

  cleanupWindow: (_window: BrowserWindow) => {
    // No window-specific cleanup needed for MCP servers
  },

  setupModule: () => {
    console.log("Setting up McpServers module");
    setupRouter();
  },

  cleanupModule: () => {
    console.log("Cleaning up McpServers module");
    removeRouter();
  },
};
