import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { readJsonFile, updateJsonFile } from "@core/utils/json-file-utils";
import {
  McpServerSchema,
  McpServerRegistrySchema,
} from "@core/validation/mcp-servers-schema";
import { getActiveVault } from "@features/vault/backend/utils";

/**
 * Gets the path to the MCP servers registry for a specific vault
 * @param vaultPath The path to the vault
 * @returns The path to the MCP servers registry file
 */
export function getMcpServersRegistryPath(vaultPath: string): string {
  return path.join(vaultPath, ".vault", "mcp-servers-registry.json");
}

/**
 * Gets all MCP servers registered for the active vault of the specified window
 * @param windowId The ID of the window making the request (optional)
 * @returns Record of server ID to server object
 */
export async function getMcpServers(
  windowId: number,
): Promise<Record<string, z.infer<typeof McpServerSchema>>> {
  try {
    // Get active vault for this window
    const activeVault = await getActiveVault(windowId);

    if (!activeVault) {
      throw new Error("No active vault found");
    }

    // Read the MCP servers registry from the vault
    const registryPath = getMcpServersRegistryPath(activeVault.path);
    const registry = await readJsonFile(registryPath, McpServerRegistrySchema, {
      servers: {},
    });

    return registry.servers;
  } catch (error) {
    console.error("Failed to get MCP servers:", error);
    return {};
  }
}

/**
 * Gets a specific MCP server from the registry for the active vault
 * @param serverId The ID of the server to get
 * @param windowId The ID of the window making the request (optional)
 * @returns The MCP server or undefined if it doesn't exist
 */
export async function getMcpServer(
  windowId: number,
  serverId: string,
): Promise<z.infer<typeof McpServerSchema> | undefined> {
  const servers = await getMcpServers(windowId);
  return servers[serverId];
}

/**
 * Adds a new MCP server to the registry for the active vault
 * @param server The server to add
 * @param windowId The ID of the window making the request (optional)
 */
export async function addMcpServer(
  server: z.infer<typeof McpServerSchema>,
  windowId: number,
): Promise<boolean> {
  try {
    // Get active vault for this window
    const activeVault = await getActiveVault(windowId);

    if (!activeVault) {
      throw new Error("No active vault found");
    }

    // Generate a new ID if not provided
    if (!server.id) {
      server.id = uuidv4();
    }

    // Get the registry path
    const registryPath = getMcpServersRegistryPath(activeVault.path);

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
 * Updates an existing MCP server in the registry for the active vault
 * @param serverId The ID of the server to update
 * @param server The updated server
 * @param windowId The ID of the window making the request (optional)
 */
export async function updateMcpServer(
  serverId: string,
  server: z.infer<typeof McpServerSchema>,
  windowId: number,
): Promise<boolean> {
  try {
    // Get active vault for this window
    const activeVault = await getActiveVault(windowId);

    if (!activeVault) {
      throw new Error("No active vault found");
    }

    // Ensure the ID is set correctly
    server.id = serverId;

    // Get the registry path
    const registryPath = getMcpServersRegistryPath(activeVault.path);

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
 * Removes an MCP server from the registry for the active vault
 * @param serverId The ID of the server to remove
 * @param windowId The ID of the window making the request (optional)
 */
export async function removeMcpServer(
  serverId: string,
  windowId: number,
): Promise<boolean> {
  try {
    // Get active vault for this window
    const activeVault = await getActiveVault(windowId);

    if (!activeVault) {
      throw new Error("No active vault found");
    }

    // Get the registry path
    const registryPath = getMcpServersRegistryPath(activeVault.path);

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
