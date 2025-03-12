/**
 * MCP Servers are the servers that the application will connect to.
 * The servers can provide different tools for LLMs and the user to use.
 * Servers are initialized by the main application process.
 */

export type MCPServerType = "command" | "sse";

export type MCPServerConfig<T extends MCPServerType> = T extends "command"
  ? MCPServerCommandConfig
  : MCPServerSSEConfig;

export interface MCPServerCommandConfig {
  command: string;
  config: Record<string, unknown>; // json configuration passed to the server during connection
}

export interface MCPServerSSEConfig {
  url: string; // url of the server
}

export interface MCPServer<T extends MCPServerType> {
  id: string; // Unique identifier for the server. Can be auto-generated.
  name: string; // Name of the server.
  type: T; // Type of the server.
  config: MCPServerConfig<T>; // Configuration for the server.
}

export interface MCPServers {
  [key: string]: MCPServer<MCPServerType>;
}

export type MCPServersList = MCPServer<MCPServerType>[];
