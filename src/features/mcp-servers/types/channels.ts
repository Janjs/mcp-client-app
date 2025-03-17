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
};
