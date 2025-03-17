import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { readJsonFile, updateJsonFile } from "@core/utils/json-file-utils";
import {
  McpServerSchema,
  McpServerRegistrySchema,
  McpServerZ,
} from "@core/validation/mcp-servers-schema";
import { ConfiguredVaultZ } from "@core/validation/schema";

/**
 * Class that manages MCP servers
 */
export class McpServersService {
  /**
   * Gets the path to the MCP servers registry for a specific vault
   * @param vaultPath The path to the vault
   * @returns The path to the MCP servers registry file
   */
  getMcpServersRegistryPath(vaultPath: string): string {
    return path.join(vaultPath, ".vault", "mcp-servers-registry.json");
  }

  /**
   * Gets all MCP servers registered for a vault
   * @param vault The vault to get servers for
   * @param forceRefresh Whether to force a refresh of the data
   * @returns Record of server ID to server object
   */
  async getMcpServers(
    vault: ConfiguredVaultZ,
  ): Promise<Record<string, z.infer<typeof McpServerSchema>>> {
    try {
      // Read the MCP servers registry from the vault
      const registryPath = this.getMcpServersRegistryPath(vault.path);
      const registry = await readJsonFile(
        registryPath,
        McpServerRegistrySchema,
        {
          servers: {},
        },
      );

      return registry.servers;
    } catch (error) {
      console.error("Failed to get MCP servers:", error);
      return {};
    }
  }

  /**
   * Gets a specific MCP server from the registry for a vault
   * @param serverId The ID of the server to get
   * @param vault The vault to get the server from
   * @returns The MCP server or undefined if it doesn't exist
   */
  async getMcpServer(
    serverId: string,
    vault: ConfiguredVaultZ,
  ): Promise<z.infer<typeof McpServerSchema> | undefined> {
    const servers = await this.getMcpServers(vault);
    return servers[serverId];
  }

  /**
   * Adds a new MCP server to the registry for a vault
   * @param server The server to add
   * @param vault The vault to add the server to
   * @returns Whether the operation was successful
   */
  async addMcpServer(
    server: McpServerZ,
    vault: ConfiguredVaultZ,
  ): Promise<boolean> {
    try {
      // Generate a new ID if not provided
      if (!server.id) {
        server.id = uuidv4();
      }

      // Get the registry path
      const registryPath = this.getMcpServersRegistryPath(vault.path);

      // Update the registry
      await updateJsonFile(
        registryPath,
        (registry) => {
          registry.servers[server.id] = server;
          return registry;
        },
        McpServerRegistrySchema,
        { servers: {} },
      );

      return true;
    } catch (error) {
      console.error("Failed to add MCP server:", error);
      return false;
    }
  }

  /**
   * Updates an existing MCP server in the registry for a vault
   * @param serverId The ID of the server to update
   * @param server The updated server
   * @param vault The vault containing the server
   * @returns Whether the operation was successful
   */
  async updateMcpServer(
    serverId: string,
    server: McpServerZ,
    vault: ConfiguredVaultZ,
  ): Promise<boolean> {
    try {
      // Ensure the ID is set correctly
      server.id = serverId;

      // Get the registry path
      const registryPath = this.getMcpServersRegistryPath(vault.path);

      // Update the registry
      await updateJsonFile(
        registryPath,
        (registry) => {
          // Check if the server exists
          if (!registry.servers[serverId]) {
            throw new Error(`Server with ID ${serverId} not found`);
          }

          registry.servers[serverId] = server;
          return registry;
        },
        McpServerRegistrySchema,
        { servers: {} },
      );

      return true;
    } catch (error) {
      console.error("Failed to update MCP server:", error);
      return false;
    }
  }

  /**
   * Removes an MCP server from the registry for a vault
   * @param serverId The ID of the server to remove
   * @param vault The vault containing the server
   * @returns Whether the operation was successful
   */
  async removeMcpServer(
    serverId: string,
    vault: ConfiguredVaultZ,
  ): Promise<boolean> {
    try {
      // Get the registry path
      const registryPath = this.getMcpServersRegistryPath(vault.path);

      // Update the registry
      await updateJsonFile(
        registryPath,
        (registry) => {
          // Check if the server exists
          if (!registry.servers[serverId]) {
            throw new Error(`Server with ID ${serverId} not found`);
          }

          // Remove the server
          delete registry.servers[serverId];
          return registry;
        },
        McpServerRegistrySchema,
        { servers: {} },
      );

      return true;
    } catch (error) {
      console.error("Failed to remove MCP server:", error);
      return false;
    }
  }
}

// Singleton instance
let mcpServersService: McpServersService | null = null;

/**
 * Get the McpServersService singleton instance
 * @returns McpServersService instance
 */
export function getMcpServersService(): McpServersService {
  if (!mcpServersService) {
    mcpServersService = new McpServersService();
  }
  return mcpServersService;
}
