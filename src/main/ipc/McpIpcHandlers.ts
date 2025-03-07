import { BrowserWindow } from 'electron'
import { ipcRegistry } from './IpcRegistry'
import { configStore } from '../config/store'
import { McpServerConfig, ToolManager } from '../types'
import { McpToolProvider } from '../services/tool/McpToolProvider'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'

// Legacy globals for backward compatibility
let legacyMcpClient: Client | null = null
let legacyMcpTransport: StdioClientTransport | null = null

// Define a more specific type for StdioClientTransport constructor
interface StdioTransportConfig {
  command: string
  args: string[]
  [key: string]: unknown
}

/**
 * Register all MCP-related IPC handlers
 */
export function registerMcpIpcHandlers(
  mainWindow: BrowserWindow,
  toolRegistry: ToolManager
): void {
  // Get all MCP server configurations
  ipcRegistry.registerHandler('mcp:get-servers', async () => {
    return configStore.getMcpServers()
  })

  // Get a specific MCP server configuration
  ipcRegistry.registerHandler('mcp:get-server', async (_event, serverId: string) => {
    return configStore.getMcpServerById(serverId)
  })

  // Add a new MCP server configuration
  ipcRegistry.registerHandler('mcp:add-server', async (_event, server: McpServerConfig) => {
    return configStore.addMcpServer(server)
  })

  // Update an existing MCP server configuration
  ipcRegistry.registerHandler('mcp:update-server', async (_event, server: McpServerConfig) => {
    return configStore.updateMcpServer(server)
  })

  // Remove an MCP server configuration
  ipcRegistry.registerHandler('mcp:remove-server', async (_event, serverId: string) => {
    // If the server is connected, disconnect first
    if (toolRegistry.isServerConnected(serverId)) {
      await toolRegistry.disconnectFromServer(serverId)
    }
    return configStore.removeMcpServer(serverId)
  })

  // Connect to an MCP server
  ipcRegistry.registerHandler('mcp:connect', async (_event, serverId: string) => {
    try {
      const success = await toolRegistry.connectToServer(serverId)
      if (success) {
        const tools = toolRegistry.getServerTools(serverId)
        // Notify frontend of successful connection
        ipcRegistry.send(mainWindow, 'mcp:connected', { serverId, tools })
      }
      return success
    } catch (error) {
      console.error('Error connecting to MCP server:', error)
      ipcRegistry.send(mainWindow, 'mcp:error', {
        serverId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  })

  // Disconnect from an MCP server
  ipcRegistry.registerHandler('mcp:disconnect', async (_event, serverId: string) => {
    try {
      const success = await toolRegistry.disconnectFromServer(serverId)
      if (success) {
        // Notify frontend of successful disconnection
        ipcRegistry.send(mainWindow, 'mcp:disconnected', { serverId })
      }
      return success
    } catch (error) {
      console.error('Error disconnecting from MCP server:', error)
      ipcRegistry.send(mainWindow, 'mcp:error', {
        serverId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  })

  // Disconnect from all MCP servers
  ipcRegistry.registerHandler('mcp:disconnect-all', async () => {
    try {
      const connectedServers = toolRegistry.getConnectedServerIds()
      await toolRegistry.disconnectAll()

      // Notify frontend of all disconnections
      for (const serverId of connectedServers) {
        ipcRegistry.send(mainWindow, 'mcp:disconnected', { serverId })
      }

      return true
    } catch (error) {
      console.error('Error disconnecting from all MCP servers:', error)
      ipcRegistry.send(mainWindow, 'mcp:error', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  })

  // Get tools from a specific MCP server
  ipcRegistry.registerHandler('mcp:get-tools', async (_event, serverId: string) => {
    if (!toolRegistry.isServerConnected(serverId)) {
      throw new Error(`MCP server with ID ${serverId} is not connected`)
    }
    return toolRegistry.getServerTools(serverId)
  })

  // Get tools from all connected MCP servers
  ipcRegistry.registerHandler('mcp:get-all-tools', async () => {
    return toolRegistry.getAllTools()
  })

  // Call a tool on a specific MCP server
  ipcRegistry.registerHandler(
    'mcp:call-tool',
    async (_event, serverId: string, toolName: string, args: Record<string, unknown>) => {
      try {
        // Notify frontend that we're calling the tool
        ipcRegistry.send(mainWindow, 'mcp:executing-tool', { serverId, toolName, args })

        // Call the tool
        const result = await toolRegistry.callTool(serverId, toolName, args)

        // Notify frontend of tool execution result
        ipcRegistry.send(mainWindow, 'mcp:tool-result', { serverId, toolName, result })

        return result
      } catch (error) {
        console.error(`Error calling tool "${toolName}" on server ${serverId}:`, error)

        // Notify frontend of error
        ipcRegistry.send(mainWindow, 'mcp:error', {
          serverId,
          toolName,
          error: error instanceof Error ? error.message : String(error)
        })

        throw error
      }
    }
  )

  // === LEGACY HANDLERS FOR BACKWARD COMPATIBILITY ===

  // Legacy connect handler
  ipcRegistry.registerHandler(
    'mcp:legacy-connect',
    async (_event, serverPath: string, args: string[] = []) => {
      try {
        // Create a temporary server config
        const tempServer: McpServerConfig = {
          id: 'legacy-server',
          name: 'Legacy Server',
          serverPath,
          args,
          autoConnect: false
        }

        // Add server to config (this will replace any existing legacy server)
        configStore.addMcpServer(tempServer)

        // Create and register provider
        const provider = new McpToolProvider(tempServer)
        toolRegistry.registerMcpProvider('legacy-server', provider)
        
        // Connect to the server
        await toolRegistry.connectToServer('legacy-server')

        // For backward compatibility, also set up the legacy globals
        if (legacyMcpClient) {
          await legacyMcpClient.close()
        }

        // Create legacy process
        // Setup legacy transport
        // Using explicit type for the StdioClientTransport constructor parameters
        const transportConfig: StdioTransportConfig = {
          command: serverPath,
          args
        }

        // Using type assertion because the SDK's typings don't match its implementation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        legacyMcpTransport = new StdioClientTransport(transportConfig as any)

        // Create legacy client with required structure for backward compatibility
        legacyMcpClient = new Client(
          {
            name: 'legacy-mcp-client',
            version: '1.0.0'
          },
          {
            capabilities: {
              tools: {}
            }
          }
        )

        // Connect the client to the transport
        await legacyMcpClient.connect(legacyMcpTransport)

        // Handle legacy process errors
        return true
      } catch (error) {
        console.error('Error in legacy connect handler:', error)
        ipcRegistry.send(
          mainWindow,
          'mcp:error',
          error instanceof Error ? error.message : String(error)
        )
        throw error
      }
    }
  )

  // Legacy disconnect handler
  ipcRegistry.registerHandler('mcp:legacy-disconnect', async () => {
    try {
      // Disconnect from legacy server
      await toolRegistry.disconnectFromServer('legacy-server')

      // Clean up legacy resources
      if (legacyMcpClient) {
        await legacyMcpClient.close()
        legacyMcpClient = null
      }

      legacyMcpTransport = null

      return true
    } catch (error) {
      console.error('Error in legacy disconnect handler:', error)
      return false
    }
  })

  // Legacy message handler
  ipcRegistry.registerListener('mcp:send-message', (_event, message: string) => {
    console.warn('Legacy mcp:send-message handler called. This is deprecated.')

    // Just echo the message back - this is just for backward compatibility
    mainWindow.webContents.send('mcp:receive-message', `LEGACY RESPONSE: ${message}`)
  })
}
