import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { McpConnections } from "@features/mcp-servers/types/connection";

const MCP_SERVER_CONNECTIONS_QUERY_KEY = ["mcp-server-connections"];

export function useMcpServerConnections() {
  return useQuery({
    queryKey: MCP_SERVER_CONNECTIONS_QUERY_KEY,
    queryFn: async () => {
      return await window.api.mcpConnection.getMcpConnections();
    },
  });
}

export function useMcpConnectionActions() {
  const cache = useQueryClient();

  const connectToServer = useMutation({
    mutationFn: async (serverId: string) => {
      return await window.api.mcpConnection.connectToServer(serverId);
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: MCP_SERVER_CONNECTIONS_QUERY_KEY });
    },
  });

  const disconnectFromServer = useMutation({
    mutationFn: async (serverId: string) => {
      return await window.api.mcpConnection.disconnectFromServer(serverId);
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: MCP_SERVER_CONNECTIONS_QUERY_KEY });
    },
  });

  return { connectToServer, disconnectFromServer };
}

export function useMcpConnectionListener() {
  const cache = useQueryClient();

  useEffect(() => {
    console.log("setting up mcp connection listener");
    const removeListener = window.api.mcpConnection.onConnectionStatusChange(
      async (serverId, status) => {
        const currentConnections = cache.getQueryData<McpConnections>(
          MCP_SERVER_CONNECTIONS_QUERY_KEY,
        );
        if (!currentConnections) {
          return;
        }
        const updatedConnections = currentConnections.map((connection) => {
          if (connection.serverId === serverId) {
            return { ...connection, status };
          }
          return connection;
        });
        cache.setQueryData(
          MCP_SERVER_CONNECTIONS_QUERY_KEY,
          updatedConnections,
        );
      },
    );

    return () => removeListener();
  }, []);
}
