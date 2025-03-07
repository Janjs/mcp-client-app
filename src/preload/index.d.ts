import { ElectronAPI } from '@electron-toolkit/preload'
import { McpServerConfig, ClaudeApiConfig, McpTool, McpToolContent } from '../main/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      mcp: {
        // Server configuration
        getServers: () => Promise<McpServerConfig[]>
        getServer: (serverId: string) => Promise<McpServerConfig | undefined>
        addServer: (server: McpServerConfig) => Promise<string>
        updateServer: (server: McpServerConfig) => Promise<boolean>
        removeServer: (serverId: string) => Promise<boolean>
        
        // Connection management
        connect: (serverId: string) => Promise<boolean>
        disconnect: (serverId: string) => Promise<boolean>
        disconnectAll: () => Promise<boolean>
        
        // Tools
        getTools: (serverId: string) => Promise<McpTool[]>
        getAllTools: () => Promise<{ serverId: string; tools: McpTool[] }[]>
        callTool: (
          serverId: string, 
          toolName: string, 
          args: Record<string, unknown>
        ) => Promise<McpToolContent[]>
        
        // Event listeners
        onConnected: (callback: (data: { serverId: string; tools: McpTool[] }) => void) => () => void
        onDisconnected: (callback: (data: { serverId: string }) => void) => () => void
        onExecutingTool: (
          callback: (data: { serverId: string; toolName: string; args: Record<string, unknown> }) => void
        ) => () => void
        onToolResult: (
          callback: (data: { serverId: string; toolName: string; result: McpToolContent[] }) => void
        ) => () => void
        onError: (callback: (error: any) => void) => () => void
        
        // Legacy API methods for backward compatibility
        onReceiveMessage: (callback: (message: string) => void) => void
        sendMessage: (message: string) => void
        connectToServer: (serverPath: string, args?: string[]) => Promise<void>
        disconnectFromServer: () => Promise<void>
      }
      claude: {
        // Configuration
        getConfig: () => Promise<ClaudeApiConfig>
        updateConfig: (apiKey?: string, model?: string) => Promise<ClaudeApiConfig>
        
        // Message handling
        sendMessage: (message: string, systemPrompt?: string) => Promise<boolean>
        
        // Tool call handling
        confirmToolCall: (callId: string, modifiedArgs?: Record<string, unknown>, conversationId?: string) => Promise<boolean>
        rejectToolCall: (callId: string, reason?: string) => Promise<boolean>
        
        // Event listeners
        onMessageChunk: (callback: (chunk: string) => void) => () => void
        onMessageComplete: (callback: () => void) => () => void
        onDetectedToolCall: (
          callback: (toolCall: { toolName: string; args: Record<string, unknown> }) => void
        ) => () => void
        onToolCallPending: (
          callback: (data: { callId: string; toolName: string; args: Record<string, unknown>; serverId: string; conversationId?: string }) => void
        ) => () => void
        onToolCallRejected: (
          callback: (data: { callId: string; toolName: string; reason?: string }) => void
        ) => () => void
        onError: (callback: (error: string) => void) => () => void
      }
    }
  }
}
