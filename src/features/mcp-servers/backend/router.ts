import { ipcMain } from "electron";
import { getEventContext } from "@core/events/handleEvent";
import { getAllMcpServersQuery } from "./queries/getAllServers";
import { getConnectionStatusQuery } from "./queries/getConnectionStatus";
import { getConnectionsQuery } from "./queries/getConnections";
import { getServerToolsQuery } from "./queries/getServerTools";
import { addServerMutation } from "./mutations/addServer";
import { updateServerMutation } from "./mutations/updateServer";
import { removeServerMutation } from "./mutations/removeServer";
import { connectToServerMutation } from "./mutations/connectToServer";
import { disconnectFromServerMutation } from "./mutations/disconnectFromServer";
import { connectVaultServersMutation } from "./mutations/connectVaultServers";
import { McpServerZ } from "@core/validation/mcp-servers-schema";
import {
  MCP_SERVERS_CHANNELS,
  MCP_CONNECTION_CHANNELS,
} from "../types/channels";

const router = ipcMain;

/**
 * Initialize IPC handlers for MCP server and connection operations
 */
export function setupRouter(): void {
  // ---- MCP Servers Operations ----

  // Get all MCP servers
  router.handle(MCP_SERVERS_CHANNELS.GET_MCP_SERVERS, async (event) => {
    const { vault } = await getEventContext(event);
    if (!vault) {
      throw new Error("No vault found");
    }
    return getAllMcpServersQuery(vault);
  });

  // Add a new MCP server
  router.handle(
    MCP_SERVERS_CHANNELS.ADD_MCP_SERVER,
    async (event, server: McpServerZ) => {
      const { vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No vault found");
      }
      return addServerMutation(server, vault);
    },
  );

  // Update an existing MCP server
  router.handle(
    MCP_SERVERS_CHANNELS.UPDATE_MCP_SERVER,
    async (event, serverId: string, server: McpServerZ) => {
      const { vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No vault found");
      }
      return updateServerMutation({
        serverId,
        server,
        vault,
      });
    },
  );

  // Remove an MCP server
  router.handle(
    MCP_SERVERS_CHANNELS.REMOVE_MCP_SERVER,
    async (event, serverId: string) => {
      const { vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No vault found");
      }
      return removeServerMutation({ serverId, vault });
    },
  );

  // ---- MCP Connection Operations ----

  // Connect to a server
  router.handle(
    MCP_CONNECTION_CHANNELS.CONNECT_TO_SERVER,
    async (event, serverId: string) => {
      const { window, vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No vault found");
      }
      return connectToServerMutation({
        serverId,
        window,
        vault,
        onStatusChange: (status) => {
          console.log("onStatusChange", status);
          router.emit(
            MCP_CONNECTION_CHANNELS.CONNECTION_STATUS_CHANGED,
            serverId,
            status,
          );
        },
      });
    },
  );
  // Disconnect from a server
  router.handle(
    MCP_CONNECTION_CHANNELS.DISCONNECT_FROM_SERVER,
    async (event, serverId: string) => {
      const { window, vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No vault found");
      }
      return disconnectFromServerMutation({
        serverId,
        window,
        vault,
        onStatusChange: (status) => {
          router.emit(
            MCP_CONNECTION_CHANNELS.CONNECTION_STATUS_CHANGED,
            serverId,
            status,
          );
        },
      });
    },
  );

  // Get connection status
  router.handle(
    MCP_CONNECTION_CHANNELS.GET_CONNECTION_STATUS,
    async (event, serverId: string) => {
      const { vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No vault found");
      }
      return getConnectionStatusQuery(vault, serverId);
    },
  );

  // Get server tools
  router.handle(
    MCP_CONNECTION_CHANNELS.GET_SERVER_TOOLS,
    async (event, serverId: string) => {
      const { vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No vault found");
      }
      return getServerToolsQuery(vault, serverId);
    },
  );

  // Connect to all servers in active vault
  router.handle(
    MCP_CONNECTION_CHANNELS.CONNECT_VAULT_SERVERS,
    async (event) => {
      const { window, vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No vault found");
      }
      return connectVaultServersMutation({
        window,
        vault,
        onStatusChange: (serverId, status) => {
          router.emit(
            MCP_CONNECTION_CHANNELS.CONNECTION_STATUS_CHANGED,
            serverId,
            status,
          );
        },
      });
    },
  );
  // Get all MCP connections
  router.handle(MCP_CONNECTION_CHANNELS.GET_MCP_CONNECTIONS, async (event) => {
    const { vault } = await getEventContext(event);
    if (!vault) {
      throw new Error("No vault found");
    }
    return getConnectionsQuery(vault);
  });
}

/**
 * Remove IPC handlers for MCP server and connection operations
 */
export function removeRouter(): void {
  // Remove MCP server handlers
  router.removeHandler(MCP_SERVERS_CHANNELS.GET_MCP_SERVERS);
  router.removeHandler(MCP_SERVERS_CHANNELS.ADD_MCP_SERVER);
  router.removeHandler(MCP_SERVERS_CHANNELS.UPDATE_MCP_SERVER);
  router.removeHandler(MCP_SERVERS_CHANNELS.REMOVE_MCP_SERVER);

  // Remove MCP connection handlers
  router.removeHandler(MCP_CONNECTION_CHANNELS.CONNECT_TO_SERVER);
  router.removeHandler(MCP_CONNECTION_CHANNELS.DISCONNECT_FROM_SERVER);
  router.removeHandler(MCP_CONNECTION_CHANNELS.GET_CONNECTION_STATUS);
  router.removeHandler(MCP_CONNECTION_CHANNELS.GET_SERVER_TOOLS);
  router.removeHandler(MCP_CONNECTION_CHANNELS.CONNECT_VAULT_SERVERS);
  router.removeHandler(MCP_CONNECTION_CHANNELS.GET_MCP_CONNECTIONS);
}
