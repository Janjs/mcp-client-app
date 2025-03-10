import { z } from "zod";
import { cacheManager } from "../../../core/cache/cache-manager";
import { McpServerSchema } from "../../../core/validation/mcp-servers-schema";
import * as mcpServersManager from "../main/mcp-servers-manager";

// Cache keys for MCP server operations
export const MCP_SERVERS_CACHE_KEYS = {
  SERVERS: "mcp-servers",
};

/**
 * Options for getting MCP servers
 */
export interface GetMcpServersOptions {
  forceRefresh?: boolean;
  windowId?: number;
}

/**
 * Initialize the MCP servers service by registering cache queries
 */
export function initMcpServersService(windowId: number): void {
  // Register the MCP servers list query
  cacheManager.registerQuery(
    MCP_SERVERS_CACHE_KEYS.SERVERS,
    () => mcpServersManager.getMcpServers(windowId),
    z.record(z.string(), McpServerSchema),
  );
}

/**
 * Get all MCP servers with cache support
 */
export async function getMcpServers(
  options: GetMcpServersOptions = {},
): Promise<Record<string, z.infer<typeof McpServerSchema>>> {
  const { forceRefresh = false, windowId } = options;

  if (forceRefresh) {
    // Clear cache and fetch fresh data
    await cacheManager.invalidateQueries(MCP_SERVERS_CACHE_KEYS.SERVERS);
  }

  // If windowId is provided, bypass cache to get window-specific servers
  if (windowId !== undefined) {
    return mcpServersManager.getMcpServers(windowId);
  }

  try {
    // Use the query method to get cached data or fetch fresh data
    return await cacheManager.query(MCP_SERVERS_CACHE_KEYS.SERVERS);
  } catch (error) {
    console.error("Error fetching cached MCP servers:", error);
    return {};
  }
}

/**
 * Add a new MCP server
 */
export async function addMcpServer(
  server: z.infer<typeof McpServerSchema>,
  windowId: number,
): Promise<boolean> {
  const result = await mcpServersManager.addMcpServer(server, windowId);
  if (result) {
    await cacheManager.invalidateQueries(MCP_SERVERS_CACHE_KEYS.SERVERS);
  }
  return result;
}

/**
 * Update an existing MCP server
 */
export async function updateMcpServer(
  serverId: string,
  server: z.infer<typeof McpServerSchema>,
  windowId: number,
): Promise<boolean> {
  const result = await mcpServersManager.updateMcpServer(
    serverId,
    server,
    windowId,
  );
  if (result) {
    await cacheManager.invalidateQueries(MCP_SERVERS_CACHE_KEYS.SERVERS);
  }
  return result;
}

/**
 * Remove an MCP server
 */
export async function removeMcpServer(
  serverId: string,
  windowId: number,
): Promise<boolean> {
  const result = await mcpServersManager.removeMcpServer(serverId, windowId);
  if (result) {
    await cacheManager.invalidateQueries(MCP_SERVERS_CACHE_KEYS.SERVERS);
  }
  return result;
}

/**
 * Subscribe to MCP servers changes
 */
export function subscribeToMcpServers(callback: () => void): () => void {
  // Subscribe to changes in the cache
  return cacheManager.subscribe(MCP_SERVERS_CACHE_KEYS.SERVERS, callback);
}
