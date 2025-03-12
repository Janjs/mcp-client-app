import { z } from "zod";
import { ToolSchema } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const ConnectionStatusMap = {
  DISCONNECTED: "DISCONNECTED",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  DISCONNECTING: "DISCONNECTING",
  ERROR: "ERROR",
} as const;

export const connectionStatus = z.enum([
  ConnectionStatusMap.DISCONNECTED,
  ConnectionStatusMap.CONNECTING,
  ConnectionStatusMap.CONNECTED,
  ConnectionStatusMap.DISCONNECTING,
  ConnectionStatusMap.ERROR,
]);

export type ConnectionStatus = z.infer<typeof connectionStatus>;

export const ToolsList = z.array(ToolSchema);

export type ConnectionTools = z.infer<typeof ToolsList>;

export interface ConnectionInfo {
  status: ConnectionStatus;
  error?: string;
  tools?: ConnectionTools;
}

// Map of vault ID to map of server ID to connection
export interface ConnectionRegistry {
  [vaultId: string]: {
    [serverId: string]: {
      connectionId: string;
      info: ConnectionInfo;
      windowIds: Set<number>; // Track which windows are using this connection
      client: Client | null;
    };
  };
}

export type McpConnection = {
  serverId: string;
  info: ConnectionInfo;
};

export type McpConnections = McpConnection[];
