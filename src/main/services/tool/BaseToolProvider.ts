import { McpTool, McpToolContent, ToolProvider } from '../../types'

/**
 * Base class for Tool providers
 */
export abstract class BaseToolProvider implements ToolProvider {
  protected tools: McpTool[] = []
  
  /**
   * Get all available tools from this provider
   */
  getTools(): McpTool[] {
    return this.tools
  }
  
  /**
   * Call a specific tool with arguments
   */
  abstract callTool(toolName: string, args: Record<string, unknown>): Promise<McpToolContent[]>
}