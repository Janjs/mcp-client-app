// Service for interacting with the Claude API through the Electron IPC

// Event listener types
type MessageChunkListener = (chunk: string) => void
type MessageCompleteListener = () => void
type ToolCallPendingListener = (data: { 
  callId: string
  toolName: string
  args: Record<string, unknown>
  serverId: string
}) => void
type ToolCallRejectedListener = (data: { 
  callId: string
  toolName: string
  reason?: string
}) => void
type ErrorListener = (error: string) => void

class ClaudeService {
  private messageChunkListeners: MessageChunkListener[] = []
  private messageCompleteListeners: MessageCompleteListener[] = []
  private toolCallPendingListeners: ToolCallPendingListener[] = []
  private toolCallRejectedListeners: ToolCallRejectedListener[] = []
  private errorListeners: ErrorListener[] = []

  constructor() {
    // Set up IPC event listeners
    window.api.claude.onMessageChunk((chunk) => {
      this.messageChunkListeners.forEach((listener) => listener(chunk))
    })

    window.api.claude.onMessageComplete(() => {
      this.messageCompleteListeners.forEach((listener) => listener())
    })

    window.api.claude.onToolCallPending((data) => {
      this.toolCallPendingListeners.forEach((listener) => listener(data))
    })

    window.api.claude.onToolCallRejected((data) => {
      this.toolCallRejectedListeners.forEach((listener) => listener(data))
    })

    window.api.claude.onError((error) => {
      this.errorListeners.forEach((listener) => listener(error))
    })
  }

  // Get API configuration
  async getConfig() {
    return window.api.claude.getConfig()
  }

  // Update API configuration
  async updateConfig(apiKey?: string, model?: string) {
    return window.api.claude.updateConfig(apiKey, model)
  }

  // Send a message to Claude
  async sendMessage(message: string, systemPrompt?: string) {
    return window.api.claude.sendMessage(message, systemPrompt)
  }

  // Confirm and execute a tool call
  async confirmToolCall(callId: string, modifiedArgs?: Record<string, unknown>, conversationId?: string) {
    return window.api.claude.confirmToolCall(callId, modifiedArgs, conversationId)
  }

  // Reject a tool call
  async rejectToolCall(callId: string, reason?: string) {
    return window.api.claude.rejectToolCall(callId, reason)
  }

  // Event subscription methods
  onMessageChunk(callback: MessageChunkListener): () => void {
    this.messageChunkListeners.push(callback)
    return () => {
      this.messageChunkListeners = this.messageChunkListeners.filter(
        (listener) => listener !== callback
      )
    }
  }

  onMessageComplete(callback: MessageCompleteListener): () => void {
    this.messageCompleteListeners.push(callback)
    return () => {
      this.messageCompleteListeners = this.messageCompleteListeners.filter(
        (listener) => listener !== callback
      )
    }
  }

  onToolCallPending(callback: ToolCallPendingListener): () => void {
    this.toolCallPendingListeners.push(callback)
    return () => {
      this.toolCallPendingListeners = this.toolCallPendingListeners.filter(
        (listener) => listener !== callback
      )
    }
  }

  onToolCallRejected(callback: ToolCallRejectedListener): () => void {
    this.toolCallRejectedListeners.push(callback)
    return () => {
      this.toolCallRejectedListeners = this.toolCallRejectedListeners.filter(
        (listener) => listener !== callback
      )
    }
  }

  onError(callback: ErrorListener): () => void {
    this.errorListeners.push(callback)
    return () => {
      this.errorListeners = this.errorListeners.filter(
        (listener) => listener !== callback
      )
    }
  }
}

// Export a singleton instance
const claudeService = new ClaudeService()
export default claudeService 