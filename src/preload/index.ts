import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { McpServerConfig, ClaudeApiConfig, McpTool, McpToolContent } from '../main/types'

// Custom APIs for renderer
const api = {
  // MCP server management
  mcp: {
    // Server configuration
    getServers: (): Promise<McpServerConfig[]> => {
      return ipcRenderer.invoke('mcp:get-servers')
    },
    getServer: (serverId: string): Promise<McpServerConfig | undefined> => {
      return ipcRenderer.invoke('mcp:get-server', serverId)
    },
    addServer: (server: McpServerConfig): Promise<string> => {
      return ipcRenderer.invoke('mcp:add-server', server)
    },
    updateServer: (server: McpServerConfig): Promise<boolean> => {
      return ipcRenderer.invoke('mcp:update-server', server)
    },
    removeServer: (serverId: string): Promise<boolean> => {
      return ipcRenderer.invoke('mcp:remove-server', serverId)
    },
    
    // Connection management
    connect: (serverId: string): Promise<boolean> => {
      return ipcRenderer.invoke('mcp:connect', serverId)
    },
    disconnect: (serverId: string): Promise<boolean> => {
      return ipcRenderer.invoke('mcp:disconnect', serverId)
    },
    disconnectAll: (): Promise<boolean> => {
      return ipcRenderer.invoke('mcp:disconnect-all')
    },
    
    // Tools
    getTools: (serverId: string): Promise<McpTool[]> => {
      return ipcRenderer.invoke('mcp:get-tools', serverId)
    },
    getAllTools: (): Promise<{ serverId: string; tools: McpTool[] }[]> => {
      return ipcRenderer.invoke('mcp:get-all-tools')
    },
    callTool: (
      serverId: string, 
      toolName: string, 
      args: Record<string, unknown>
    ): Promise<McpToolContent[]> => {
      return ipcRenderer.invoke('mcp:call-tool', serverId, toolName, args)
    },
    
    // Event listeners
    onConnected: (callback: (data: { serverId: string; tools: McpTool[] }) => void): () => void => {
      const handler = (_event: any, data: { serverId: string; tools: McpTool[] }) => {
        callback(data)
      }
      ipcRenderer.on('mcp:connected', handler)
      return () => ipcRenderer.removeListener('mcp:connected', handler)
    },
    onDisconnected: (callback: (data: { serverId: string }) => void): () => void => {
      const handler = (_event: any, data: { serverId: string }) => {
        callback(data)
      }
      ipcRenderer.on('mcp:disconnected', handler)
      return () => ipcRenderer.removeListener('mcp:disconnected', handler)
    },
    onExecutingTool: (
      callback: (data: { serverId: string; toolName: string; args: Record<string, unknown> }) => void
    ): () => void => {
      const handler = (_event: any, data: any) => {
        callback(data)
      }
      ipcRenderer.on('mcp:executing-tool', handler)
      return () => ipcRenderer.removeListener('mcp:executing-tool', handler)
    },
    onToolResult: (
      callback: (data: { serverId: string; toolName: string; result: McpToolContent[] }) => void
    ): () => void => {
      const handler = (_event: any, data: any) => {
        callback(data)
      }
      ipcRenderer.on('mcp:tool-result', handler)
      return () => ipcRenderer.removeListener('mcp:tool-result', handler)
    },
    onError: (callback: (error: any) => void): () => void => {
      const handler = (_event: any, error: any) => {
        callback(error)
      }
      ipcRenderer.on('mcp:error', handler)
      return () => ipcRenderer.removeListener('mcp:error', handler)
    },
    
    // Legacy API methods for backward compatibility
    onReceiveMessage: (callback: (message: string) => void): void => {
      ipcRenderer.on('mcp:receive-message', (_event, message) => {
        callback(message)
      })
    },
    sendMessage: (message: string): void => {
      console.warn('mcp.sendMessage is deprecated. Please use mcp.callTool instead.')
      ipcRenderer.send('mcp:send-message', message)
    },
    connectToServer: (serverPath: string, args: string[] = []): Promise<void> => {
      console.warn('mcp.connectToServer is deprecated. Please use mcp.connect with a server ID instead.')
      return ipcRenderer.invoke('mcp:legacy-connect', serverPath, args)
    },
    disconnectFromServer: (): Promise<void> => {
      console.warn('mcp.disconnectFromServer is deprecated. Please use mcp.disconnect with a server ID instead.')
      return ipcRenderer.invoke('mcp:legacy-disconnect')
    }
  },
  
  // Claude API
  claude: {
    // Configuration
    getConfig: (): Promise<ClaudeApiConfig> => {
      return ipcRenderer.invoke('claude:get-config')
    },
    updateConfig: (apiKey?: string, model?: string): Promise<ClaudeApiConfig> => {
      return ipcRenderer.invoke('claude:update-config', apiKey, model)
    },
    
    // Message handling
    sendMessage: (message: string, systemPrompt?: string): Promise<boolean> => {
      return ipcRenderer.invoke('claude:send-message', message, systemPrompt)
    },
    
    // Tool call confirmation
    confirmToolCall: (callId: string, modifiedArgs?: Record<string, unknown>, conversationId?: string): Promise<boolean> => {
      return ipcRenderer.invoke('claude:confirm-tool-call', callId, modifiedArgs, conversationId)
    },
    
    rejectToolCall: (callId: string, reason?: string): Promise<boolean> => {
      return ipcRenderer.invoke('claude:reject-tool-call', callId, reason)
    },
    
    // Event listeners
    onMessageChunk: (callback: (chunk: string) => void): () => void => {
      const handler = (_event: any, chunk: string) => {
        callback(chunk)
      }
      ipcRenderer.on('claude:message-chunk', handler)
      return () => ipcRenderer.removeListener('claude:message-chunk', handler)
    },
    onMessageComplete: (callback: () => void): () => void => {
      const handler = () => {
        callback()
      }
      ipcRenderer.on('claude:message-complete', handler)
      return () => ipcRenderer.removeListener('claude:message-complete', handler)
    },
    onDetectedToolCall: (
      callback: (toolCall: { toolName: string; args: Record<string, unknown> }) => void
    ): () => void => {
      const handler = (_event: any, toolCall: any) => {
        callback(toolCall)
      }
      ipcRenderer.on('claude:detected-tool-call', handler)
      return () => ipcRenderer.removeListener('claude:detected-tool-call', handler)
    },
    onToolCallPending: (
      callback: (data: { callId: string; toolName: string; args: Record<string, unknown>; serverId: string }) => void
    ): () => void => {
      const handler = (_event: any, data: any) => {
        callback(data)
      }
      ipcRenderer.on('claude:tool-call-pending', handler)
      return () => ipcRenderer.removeListener('claude:tool-call-pending', handler)
    },
    onToolCallRejected: (
      callback: (data: { callId: string; toolName: string; reason?: string }) => void
    ): () => void => {
      const handler = (_event: any, data: any) => {
        callback(data)
      }
      ipcRenderer.on('claude:tool-call-rejected', handler)
      return () => ipcRenderer.removeListener('claude:tool-call-rejected', handler)
    },
    onError: (callback: (error: string) => void): () => void => {
      const handler = (_event: any, error: string) => {
        callback(error)
      }
      ipcRenderer.on('claude:error', handler)
      return () => ipcRenderer.removeListener('claude:error', handler)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
