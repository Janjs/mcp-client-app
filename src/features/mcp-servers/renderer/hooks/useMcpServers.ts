import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { McpServerZ } from '../../../../core/validation/mcp-servers-schema';

/**
 * Custom hook for managing MCP servers
 */
export function useMcpServers() {
  const queryClient = useQueryClient();
  const MCP_SERVERS_QUERY_KEY = ['mcp-servers'];

  // Fetch all MCP servers
  const { data: mcpServers = {}, isLoading, error, refetch } = useQuery({
    queryKey: MCP_SERVERS_QUERY_KEY,
    queryFn: async () => {
      return await window.api.mcpServers.getMcpServers(false);
    },
  });

  // Add a new MCP server
  const addMcpServerMutation = useMutation({
    mutationFn: async (server: McpServerZ) => {
      return await window.api.mcpServers.addMcpServer(server);
    },
    onSuccess: () => {
      // Invalidate and refetch the MCP servers query
      queryClient.invalidateQueries({ queryKey: MCP_SERVERS_QUERY_KEY });
    },
  });

  // Update an existing MCP server
  const updateMcpServerMutation = useMutation({
    mutationFn: async ({ serverId, server }: { serverId: string; server: McpServerZ }) => {
      return await window.api.mcpServers.updateMcpServer(serverId, server);
    },
    onSuccess: () => {
      // Invalidate and refetch the MCP servers query
      queryClient.invalidateQueries({ queryKey: MCP_SERVERS_QUERY_KEY });
    },
  });

  // Remove an MCP server
  const removeMcpServerMutation = useMutation({
    mutationFn: async (serverId: string) => {
      return await window.api.mcpServers.removeMcpServer(serverId);
    },
    onSuccess: () => {
      // Invalidate and refetch the MCP servers query
      queryClient.invalidateQueries({ queryKey: MCP_SERVERS_QUERY_KEY });
    },
  });

  return {
    mcpServers,
    isLoading,
    error,
    refetch,
    addMcpServer: addMcpServerMutation.mutate,
    updateMcpServer: updateMcpServerMutation.mutate,
    removeMcpServer: removeMcpServerMutation.mutate,
    isAddingMcpServer: addMcpServerMutation.isPending,
    isUpdatingMcpServer: updateMcpServerMutation.isPending,
    isRemovingMcpServer: removeMcpServerMutation.isPending,
  };
} 