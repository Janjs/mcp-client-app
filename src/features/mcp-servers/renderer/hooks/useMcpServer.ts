// Use this hook to get the connection status and tools for a given server

import { useQuery } from "@tanstack/react-query";

export function useMcpServer(serverId: string) {
  const statusQuery = useQuery({
    queryKey: ["mcp-server", serverId, "status"],
    queryFn: () => window.api.mcpConnection.getConnectionStatus(serverId),
  });

  const toolsQuery = useQuery({
    queryKey: ["mcp-server", serverId, "tools"],
    queryFn: () => window.api.mcpConnection.getServerTools(serverId),
  });

  return {
    status: statusQuery,
    tools: toolsQuery,
  };
}

export type UseMcpServer = ReturnType<typeof useMcpServer>;
