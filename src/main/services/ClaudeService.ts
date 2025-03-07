import { jsonSchema, streamText, Tool, tool, CoreMessage } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { BrowserWindow } from 'electron'
import { configStore } from '../config/store'
import { mcpManager } from './McpManager'
import { McpTool, ParsedToolCall } from '../types'

// Define the message interface compatible with CoreMessage
interface Message {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  name?: string;
}

// Convert our Message to CoreMessage for AI SDK
function toCoreCoreMessage(message: Message): CoreMessage {
  if (message.role === 'user') {
    return {
      role: 'user',
      content: message.content
    };
  } else if (message.role === 'assistant') {
    return {
      role: 'assistant',
      content: message.content
    };
  } else if (message.role === 'system') {
    return {
      role: 'system',
      content: message.content
    };
  } else {
    // For tool messages, map to user messages with special content format
    return {
      role: 'user',
      content: `[Tool Result: ${message.name}] ${message.content}`
    };
  }
}

export class ClaudeService {
  private apiKey: string
  private model: string
  // Track pending tool calls that need confirmation
  private pendingToolCalls: Map<string, { toolName: string; args: Record<string, unknown>; serverId: string }> = new Map()
  // Track conversation history
  private conversationHistory: Map<string, Message[]> = new Map()

  constructor() {
    const config = configStore.getClaudeApiConfig()
    this.apiKey = config.apiKey
    this.model = config.model || 'claude-3-5-sonnet-latest'
  }

  /**
   * Initialize the service with the latest configuration
   */
  init(): void {
    const config = configStore.getClaudeApiConfig()
    this.apiKey = config.apiKey
    this.model = config.model || 'claude-3-5-sonnet-latest'
  }

  /**
   * Update the API configuration
   */
  updateConfig(apiKey?: string, model?: string): void {
    if (apiKey) this.apiKey = apiKey
    if (model) this.model = model

    // Save to config store
    configStore.updateClaudeApiConfig({
      apiKey: this.apiKey,
      model: this.model
    })
  }

  /**
   * Helper function to parse a tool call from Claude's response
   */
  parseToolCall(text: string): ParsedToolCall | null {
    // Match pattern: "I'll use the [tool name] tool with these arguments: { ... }"
    const toolCallRegex = /I'll use the (\w+(?:-\w+)*) tool with these arguments: ({[^}]+})/i
    const match = text.match(toolCallRegex)

    if (!match) return null

    const toolName = match[1]
    const argsString = match[2]

    try {
      // Try to parse the JSON arguments
      const args = JSON.parse(argsString)
      return { toolName, args }
    } catch (error) {
      console.error('Error parsing tool arguments:', error)
      return null
    }
  }

  /**
   * Generate a unique ID for tool calls
   */
  private generateToolCallId(): string {
    return `tool-call-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  }

  /**
   * Generate a unique ID for conversations
   */
  private generateConversationId(): string {
    return `conv-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  }

  /**
   * Create a pending tool call that needs user confirmation
   */
  createPendingToolCall(toolName: string, args: Record<string, unknown>, serverId: string): string {
    const callId = this.generateToolCallId()
    this.pendingToolCalls.set(callId, { toolName, args, serverId })
    return callId
  }

  /**
   * Get a pending tool call by ID
   */
  getPendingToolCall(callId: string): { toolName: string; args: Record<string, unknown>; serverId: string } | undefined {
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
  getOrCreateConversation(id?: string): { id: string; messages: Message[] } {
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
  addMessageToConversation(conversationId: string, message: Message): void {
    const conversation = this.getOrCreateConversation(conversationId)
    conversation.messages.push(message)
    this.conversationHistory.set(conversationId, conversation.messages)
  }

  /**
   * Execute a confirmed tool call and send the result back to the LLM
   */
  async executeToolCall(
    callId: string, 
    modifiedArgs?: Record<string, unknown>,
    mainWindow?: BrowserWindow,
    conversationId?: string
  ): Promise<AsyncIterable<string>> {
    const pendingCall = this.pendingToolCalls.get(callId)
    if (!pendingCall) {
      throw new Error(`Tool call with ID ${callId} not found`)
    }

    const { toolName, args, serverId } = pendingCall
    const argsToUse = modifiedArgs || args

    try {
      // Notify UI if window is provided
      if (mainWindow) {
        mainWindow.webContents.send('claude:executing-tool', {
          toolName,
          args: argsToUse
        })
      }

      // Execute the tool call
      const result = await mcpManager.callTool(serverId, toolName, argsToUse)

      // Create a serializable version of the result by converting to and from JSON
      // This ensures we don't have any non-serializable objects that would cause IPC issues
      const serializableResult = JSON.parse(JSON.stringify(result))

      // Notify UI of completion
      if (mainWindow) {
        mainWindow.webContents.send('claude:tool-result', {
          toolName,
          result: serializableResult
        })
      }

      // Remove the pending call
      this.removePendingToolCall(callId)

      // Generate a response for Claude based on the tool result
      const toolResultMessage = `I executed the ${toolName} tool with the provided arguments, and here is the result:\n\n${JSON.stringify(serializableResult, null, 2)}`
      
      // Add tool result to conversation history
      if (conversationId) {
        this.addMessageToConversation(conversationId, {
          role: 'tool',
          content: JSON.stringify(serializableResult),
          name: toolName
        })
      }

      // Send the result back to Claude for further processing
      const systemPrompt = `You previously attempted to call the ${toolName} tool. The tool has been executed and the results are provided. Please analyze these results and respond accordingly.`
      
      // Send the result back to Claude with the conversation history
      return this.sendMessage(toolResultMessage, systemPrompt, mainWindow, conversationId)
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error)
      
      // Remove the pending call even if it failed
      this.removePendingToolCall(callId)
      
      // Generate error response
      const errorMessage = `I attempted to execute the ${toolName} tool but encountered an error: ${error instanceof Error ? error.message : String(error)}`
      
      // Add error message to conversation history
      if (conversationId) {
        this.addMessageToConversation(conversationId, {
          role: 'tool',
          content: errorMessage,
          name: toolName
        })
      }
      
      // Send the error back to Claude
      const systemPrompt = `You previously attempted to call the ${toolName} tool but there was an error. Please suggest an alternative approach.`
      return this.sendMessage(errorMessage, systemPrompt, mainWindow, conversationId)
    }
  }

  /**
   * Send a message to Claude with MCP tools from all connected servers
   */
  async sendMessage(
    message: string,
    systemPrompt?: string,
    mainWindow?: BrowserWindow,
    conversationId?: string
  ): Promise<AsyncIterable<string>> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured')
    }

    const anthropic = createAnthropic({
      apiKey: this.apiKey
    })

    // Get all available tools from all connected MCP servers
    const allServerTools = mcpManager.getAllTools()
    const allTools: McpTool[] = allServerTools.flatMap((serverTools) => serverTools.tools)

    // Get or create conversation
    const conversation = this.getOrCreateConversation(conversationId)

    // Add user message to conversation history
    this.addMessageToConversation(conversation.id, {
      role: 'user',
      content: message
    })

    // Setup tool definitions for Claude
    const toolsDefinition = allTools.reduce(
      (acc, t) => {
        acc[t.name] = tool({
          description: t.description || '',
          parameters: jsonSchema(t.inputSchema || {}),
          execute: async (args) => {
            console.log(`Tool call requested: ${t.name} with args:`, args)

            // Find which server has this tool
            const serverId = mcpManager.findServerWithTool(t.name)
            if (!serverId) {
              return [
                {
                  type: 'text',
                  text: `Error: Tool ${t.name} not found on any connected MCP server`
                }
              ]
            }

            // Create a pending tool call that needs user confirmation
            const callId = this.createPendingToolCall(t.name, args as Record<string, unknown>, serverId)

            // Notify UI about the tool call that needs confirmation
            if (mainWindow) {
              mainWindow.webContents.send('claude:tool-call-pending', {
                callId,
                toolName: t.name,
                args,
                serverId,
                conversationId: conversation.id
              })
            }

            // Return a message indicating the tool call needs confirmation
            return [
              {
                type: 'text',
                text: `I need to use the ${t.name} tool with these arguments: ${JSON.stringify(args, null, 2)}. This tool call requires user confirmation before it can be executed.`
              }
            ]
          }
        })
        return acc
      },
      {} as Record<string, Tool>
    )

    // Prepare messages array for Claude - convert our Messages to CoreMessages
    const messagesForClaude: CoreMessage[] = conversation.messages.map(toCoreCoreMessage)
    
    // Add system message if provided (as the first message)
    if (systemPrompt) {
      messagesForClaude.unshift({
        role: 'system',
        content: systemPrompt
      })
    }

    // Send request to Claude
    const { textStream } = await streamText({
      model: anthropic(this.model),
      messages: messagesForClaude,
      tools: toolsDefinition,
      onFinish: ({ response }) => {
        // Add assistant's response to conversation history
        if (response.messages && response.messages.length > 0) {
          response.messages.forEach(msg => {
            if (msg.role === 'assistant') {
              this.addMessageToConversation(conversation.id, {
                role: 'assistant',
                content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
              })
            }
          })
        }
      }
    })

    return textStream
  }
}

// Export singleton instance
export const claudeService = new ClaudeService()
