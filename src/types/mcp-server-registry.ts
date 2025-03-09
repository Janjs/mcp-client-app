/**
 * The MCP server registry is a registry of all the MCP servers that the application has.
 * This is stored as a configuration file in the vaults folder.
 *
 * The data structured described here is used to represent the servers in memory and on disk.
 */

import { MCPServers } from "./mcp-servers";

export interface MCPServerRegistry {
  servers: MCPServers;
}
