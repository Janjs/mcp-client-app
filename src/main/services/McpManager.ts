import { ChildProcess, spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { configStore } from '../config/store';
import { McpTool, McpToolContent } from '../types';

// Define a more specific type for StdioClientTransport constructor
// The actual SDK expects a different shape than its typings indicate
interface StdioTransportConfig {
  command: string;
  args: string[];
  [key: string]: unknown;
}

export class McpManager {
  private activeServers: Map<string, {
    process: ChildProcess;
    client: Client;
    transport: StdioClientTransport;
    tools: McpTool[];
  }> = new Map();

  /**
   * Initialize MCP servers that are configured to auto-connect
   */
  async initAutoConnectServers(): Promise<void> {
    const servers = configStore.getMcpServers().filter(server => server.autoConnect);
    
    for (const server of servers) {
      try {
        await this.connectToServer(server.id);
      } catch (error) {
        console.error(`Failed to auto-connect to MCP server ${server.name}:`, error);
      }
    }
  }

  /**
   * Connect to a specific MCP server by ID
   */
  async connectToServer(serverId: string): Promise<boolean> {
    try {
      const serverConfig = configStore.getMcpServerById(serverId);
      if (!serverConfig) {
        throw new Error(`MCP server with ID ${serverId} not found`);
      }

      // Check if already connected
      if (this.activeServers.has(serverId)) {
        console.log(`Already connected to MCP server: ${serverConfig.name}`);
        return true;
      }

      // Start the MCP server process
      const mcpProcess = spawn(serverConfig.serverPath, serverConfig.args);
      
      // Setup MCP transport
      // Using explicit type for the StdioClientTransport constructor parameters
      const transportConfig: StdioTransportConfig = {
        command: serverConfig.serverPath,
        args: serverConfig.args
      };
      
      // Using type assertion because the SDK's typings don't match its implementation
      // This is a common issue with JavaScript libraries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transport = new StdioClientTransport(transportConfig as any);

      // Create MCP client
      const client = new Client(
        {
          name: `mcp-client-app-${serverId}`,
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );
      
      // Connect the client to the transport
      await client.connect(transport);
      
      // Fetch available tools
      const toolsResult = await client.listTools();
      const tools = toolsResult.tools;

      // Store the active server
      this.activeServers.set(serverId, {
        process: mcpProcess,
        client,
        transport,
        tools
      });

      console.log(`Connected to MCP server: ${serverConfig.name}`);
      return true;
    } catch (error) {
      console.error('Error connecting to MCP server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from a specific MCP server
   */
  async disconnectFromServer(serverId: string): Promise<boolean> {
    const serverInfo = this.activeServers.get(serverId);
    if (!serverInfo) {
      return false;
    }

    try {
      // Cleanup resources
      await serverInfo.client.close();
      if (serverInfo.process) {
        serverInfo.process.kill();
      }
      this.activeServers.delete(serverId);
      return true;
    } catch (error) {
      console.error(`Error disconnecting from MCP server ${serverId}:`, error);
      return false;
    }
  }

  /**
   * Disconnect from all active MCP servers
   */
  async disconnectAll(): Promise<void> {
    const serverIds = Array.from(this.activeServers.keys());
    for (const id of serverIds) {
      await this.disconnectFromServer(id);
    }
  }

  /**
   * Get all available MCP tools from all connected servers
   */
  getAllTools(): { serverId: string; tools: McpTool[] }[] {
    return Array.from(this.activeServers.entries()).map(([serverId, info]) => {
      return {
        serverId,
        tools: info.tools
      };
    });
  }

  /**
   * Get tools for a specific server
   */
  getServerTools(serverId: string): McpTool[] {
    return this.activeServers.get(serverId)?.tools || [];
  }

  /**
   * Call a tool on a specific MCP server
   */
  async callTool(
    serverId: string, 
    toolName: string, 
    args: Record<string, unknown>
  ): Promise<McpToolContent[]> {
    const serverInfo = this.activeServers.get(serverId);
    if (!serverInfo) {
      throw new Error(`MCP server with ID ${serverId} not found or not connected`);
    }

    try {
      const result = await serverInfo.client.callTool({
        name: toolName,
        arguments: args
      });

      return result.content as McpToolContent[];
    } catch (error) {
      console.error(`Error calling tool "${toolName}" on server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Find which server has a specific tool
   */
  findServerWithTool(toolName: string): string | null {
    for (const [serverId, info] of this.activeServers.entries()) {
      if (info.tools.some(tool => tool.name === toolName)) {
        return serverId;
      }
    }
    return null;
  }
  
  /**
   * Check if a server is connected
   */
  isServerConnected(serverId: string): boolean {
    return this.activeServers.has(serverId);
  }
  
  /**
   * Get connected server IDs
   */
  getConnectedServerIds(): string[] {
    return Array.from(this.activeServers.keys());
  }
}

// Export singleton instance
export const mcpManager = new McpManager(); 