import { McpTool, McpToolContent, ToolManager } from '../../types'
import { McpToolProvider } from './McpToolProvider'

/**
 * Tool Registry to manage all tool providers
 */
export class ToolRegistry implements ToolManager {
  private mcpToolProviders: Map<string, McpToolProvider> = new Map()
  
  /**
   * Connect to an MCP server
   */
  async connectToServer(serverId: string): Promise<boolean> {
    try {
      const provider = this.mcpToolProviders.get(serverId)
      if (provider) {
        return provider.connect()
      }
      
      // If provider doesn't exist, it needs to be created and registered first
      throw new Error(`MCP provider with ID ${serverId} not registered`)
    } catch (error) {
      console.error(`Error connecting to server ${serverId}:`, error)
      throw error
    }
  }
  
  /**
   * Register a new MCP tool provider
   */
  registerMcpProvider(serverId: string, provider: McpToolProvider): void {
    this.mcpToolProviders.set(serverId, provider)
  }
  
  /**
   * Disconnect from an MCP server
   */
  async disconnectFromServer(serverId: string): Promise<boolean> {
    const provider = this.mcpToolProviders.get(serverId)
    if (!provider) {
      return false
    }
    
    return await provider.disconnect()
  }
  
  /**
   * Disconnect from all active MCP servers
   */
  async disconnectAll(): Promise<void> {
    const serverIds = Array.from(this.mcpToolProviders.keys())
    for (const id of serverIds) {
      await this.disconnectFromServer(id)
    }
  }
  
  /**
   * Get all available tools from all connected servers
   */
  getAllTools(): { serverId: string; tools: McpTool[] }[] {
    return Array.from(this.mcpToolProviders.entries())
      .filter(([_, provider]) => provider.isConnected())
      .map(([serverId, provider]) => {
        return {
          serverId,
          tools: provider.getTools()
        }
      })
  }
  
  /**
   * Get tools for a specific server
   */
  getServerTools(serverId: string): McpTool[] {
    return this.mcpToolProviders.get(serverId)?.getTools() || []
  }
  
  /**
   * Call a tool on a specific MCP server
   */
  async callTool(
    serverId: string, 
    toolName: string, 
    args: Record<string, unknown>
  ): Promise<McpToolContent[]> {
    console.log(`ToolRegistry: Calling tool ${toolName} on server ${serverId}`)
    console.log(`ToolRegistry: Available providers:`, Array.from(this.mcpToolProviders.keys()))
    
    const provider = this.mcpToolProviders.get(serverId)
    if (!provider) {
      console.error(`ToolRegistry: Provider with ID ${serverId} not found`)
      throw new Error(`MCP provider with ID ${serverId} not found or not connected`)
    }
    
    console.log(`ToolRegistry: Provider found, provider connected: ${provider.isConnected()}`)
    const result = await provider.callTool(toolName, args)
    console.log(`ToolRegistry: Tool call result:`, result)
    
    return result
  }
  
  /**
   * Find which server has a specific tool
   */
  findServerWithTool(toolName: string): string | null {
    for (const [serverId, provider] of this.mcpToolProviders.entries()) {
      if (provider.isConnected() && provider.getTools().some(tool => tool.name === toolName)) {
        return serverId
      }
    }
    return null
  }
  
  /**
   * Check if a server is connected
   */
  isServerConnected(serverId: string): boolean {
    return this.mcpToolProviders.get(serverId)?.isConnected() || false
  }
  
  /**
   * Get connected server IDs
   */
  getConnectedServerIds(): string[] {
    return Array.from(this.mcpToolProviders.entries())
      .filter(([_, provider]) => provider.isConnected())
      .map(([serverId]) => serverId)
  }
}