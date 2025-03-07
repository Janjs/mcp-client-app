import { BrowserWindow } from 'electron'
import { LlmConfig, LlmConversation, LlmMessage, LlmProvider, ParsedToolCall } from '../../types'

/**
 * Base class for LLM providers that implements common functionality
 */
export abstract class BaseLlmProvider implements LlmProvider {
  // Track pending tool calls that need confirmation
  protected pendingToolCalls: Map<string, { toolName: string; args: Record<string, unknown>; serverId: string; conversationId?: string }> = new Map()
  // Track conversation history
  protected conversationHistory: Map<string, LlmMessage[]> = new Map()
  // API Configuration
  protected apiKey: string
  protected model: string

  constructor(config: LlmConfig) {
    this.apiKey = config.apiKey
    this.model = config.model
  }

  /**
   * Initialize the provider with configuration
   */
  abstract init(): void

  /**
   * Update the provider configuration
   */
  updateConfig(config: Partial<LlmConfig>): void {
    if (config.apiKey) this.apiKey = config.apiKey
    if (config.model) this.model = config.model
  }

  /**
   * Get the current configuration
   */
  getConfig(): LlmConfig {
    return {
      apiKey: this.apiKey,
      model: this.model
    }
  }

  /**
   * Generate a unique ID for tool calls
   */
  protected generateToolCallId(): string {
    return `tool-call-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  }

  /**
   * Generate a unique ID for conversations
   */
  protected generateConversationId(): string {
    return `conv-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  }

  /**
   * Create a pending tool call that needs user confirmation
   */
  createPendingToolCall(
    toolName: string, 
    args: Record<string, unknown>, 
    serverId: string,
    conversationId?: string
  ): string {
    const callId = this.generateToolCallId()
    this.pendingToolCalls.set(callId, { toolName, args, serverId, conversationId })
    return callId
  }

  /**
   * Get a pending tool call by ID
   */
  getPendingToolCall(callId: string): { toolName: string; args: Record<string, unknown>; serverId: string; conversationId?: string } | undefined {
    return this.pendingToolCalls.get(callId)
  }

  /**
   * Remove a pending tool call after it's been handled
   */
  removePendingToolCall(callId: string): void {
    this.pendingToolCalls.delete(callId)
  }

  /**
   * Get conversation history by ID, or start a new conversation
   */
  getOrCreateConversation(id?: string): LlmConversation {
    const conversationId = id || this.generateConversationId()
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, [])
    }
    return { 
      id: conversationId, 
      messages: this.conversationHistory.get(conversationId) || [] 
    }
  }

  /**
   * Add a message to conversation history
   */
  addMessageToConversation(conversationId: string, message: LlmMessage): void {
    const conversation = this.getOrCreateConversation(conversationId)
    conversation.messages.push(message)
    this.conversationHistory.set(conversationId, conversation.messages)
  }

  /**
   * Parse a tool call from text response
   */
  abstract parseToolCall(text: string): ParsedToolCall | null

  /**
   * Send a message to the LLM
   */
  abstract sendMessage(
    message: string,
    options?: {
      systemPrompt?: string;
      conversationId?: string;
    }
  ): Promise<AsyncIterable<string>>

  /**
   * Execute a confirmed tool call
   */
  abstract executeToolCall(
    callId: string,
    modifiedArgs?: Record<string, unknown>,
    conversationId?: string
  ): Promise<AsyncIterable<string>>
}