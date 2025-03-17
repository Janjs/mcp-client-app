import { z } from "zod";
import { McpServerSchema } from "@core/validation/mcp-servers-schema";
import { getMcpServersService } from "../services/mcp-servers-service";
import { invalidateAllMcpServersQuery } from "../queries/getAllServers";
import { ConfiguredVaultZ } from "@core/validation/schema";
/**
 * Updates an existing MCP server
 * @param options Options for the mutation
 * @returns Whether the operation was successful
 */
export async function updateServerMutation(options: {
  serverId: string;
  server: z.infer<typeof McpServerSchema>;
  vault: ConfiguredVaultZ;
}): Promise<boolean> {
  const { serverId, server, vault } = options;

  // Update the server
  const result = await getMcpServersService().updateMcpServer(
    serverId,
    server,
    vault,
  );

  // Invalidate the cache if successful
  if (result) {
    await invalidateAllMcpServersQuery();
  }

  return result;
}
