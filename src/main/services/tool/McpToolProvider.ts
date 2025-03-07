import { ChildProcess, spawn } from 'child_process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { McpServerConfig, McpTool, McpToolContent } from '../../types'
import { BaseToolProvider } from './BaseToolProvider'

// Define a more specific type for StdioClientTransport constructor
interface StdioTransportConfig {
  command: string
  args: string[]
  [key: string]: unknown
}

/**
 * MCP specific tool provider implementation
 */
export class McpToolProvider extends BaseToolProvider {
  private serverConfig: McpServerConfig
  private process?: ChildProcess
  private client?: Client
  private transport?: StdioClientTransport
  private connected: boolean = false

  constructor(serverConfig: McpServerConfig) {
    super()
    this.serverConfig = serverConfig
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<boolean> {
    try {
      // Check if already connected
      if (this.connected) {
        console.log(`Already connected to MCP server: ${this.serverConfig.name}`)
        return true
      }

      // Start the MCP server process
      this.process = spawn(this.serverConfig.serverPath, this.serverConfig.args)
      
      // Setup MCP transport
      const transportConfig: StdioTransportConfig = {
        command: this.serverConfig.serverPath,
        args: this.serverConfig.args
      }
      
      // Using type assertion because the SDK's typings don't match its implementation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.transport = new StdioClientTransport(transportConfig as any)

      // Create MCP client
      this.client = new Client(
        {
          name: `mcp-client-app-${this.serverConfig.id}`,
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      )
      
      // Connect the client to the transport
      await this.client.connect(this.transport)
      
      // Fetch available tools
      const toolsResult = await this.client.listTools()
      this.tools = toolsResult.tools

      this.connected = true
      console.log(`Connected to MCP server: ${this.serverConfig.name}`)
      return true
    } catch (error) {
      console.error('Error connecting to MCP server:', error)
      this.connected = false
      throw error
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<boolean> {
    if (!this.connected) {
      return true
    }

    try {
      // Cleanup resources
      if (this.client) {
        await this.client.close()
      }
      if (this.process) {
        this.process.kill()
      }
      this.connected = false
      return true
    } catch (error) {
      console.error(`Error disconnecting from MCP server ${this.serverConfig.id}:`, error)
      return false
    }
  }

  /**
   * Call a tool with arguments
   */
  async callTool(toolName: string, args: Record<string, unknown>): Promise<McpToolContent[]> {
    console.log(`McpToolProvider(${this.serverConfig.id}): Calling tool ${toolName}`)
    
    if (!this.connected || !this.client) {
      console.error(`McpToolProvider(${this.serverConfig.id}): Not connected, client exists: ${!!this.client}`)
      throw new Error('MCP server not connected')
    }

    try {
      console.log(`McpToolProvider(${this.serverConfig.id}): Executing client.callTool with ${toolName}`)
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      })
      
      console.log(`McpToolProvider(${this.serverConfig.id}): Raw result:`, result)
      console.log(`McpToolProvider(${this.serverConfig.id}): Result content:`, result.content)

      return result.content as McpToolContent[]
    } catch (error) {
      console.error(`Error calling tool "${toolName}" in ${this.serverConfig.id}:`, error)
      throw error
    }
  }

  /**
   * Check if connected to the server
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Get server ID
   */
  getServerId(): string {
    return this.serverConfig.id
  }

  /**
   * Get server config
   */
  getServerConfig(): McpServerConfig {
    return this.serverConfig
  }
}