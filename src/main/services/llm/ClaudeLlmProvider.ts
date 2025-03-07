import { BrowserWindow } from 'electron'
import { jsonSchema, streamText, Tool, tool, CoreMessage } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { 
  LlmMessage, 
  LlmConfig, 
  ParsedToolCall, 
  ClaudeApiConfig, 
  McpTool 
} from '../../types'
import { BaseLlmProvider } from './BaseLlmProvider'
import { ToolRegistry } from '../tool/ToolRegistry'

/**
 * Convert internal LlmMessage to CoreMessage for AI SDK
 */
function toLlmSdkMessage(message: LlmMessage): CoreMessage {
  if (message.role === 'user') {
    return {
      role: 'user',
      content: message.content
    }
  } else if (message.role === 'assistant') {
    return {
      role: 'assistant',
      content: message.content
    }
  } else if (message.role === 'system') {
    return {
      role: 'system',
      content: message.content
    }
  } else {
    // For tool messages, format as user messages with special content
    return {
      role: 'user',
      content: `[Tool Result: ${message.name}] ${message.content}`
    }
  }
}

/**
 * Claude-specific LLM provider implementation
 */
export class ClaudeLlmProvider extends BaseLlmProvider {
  private toolRegistry: ToolRegistry
  private mainWindow?: BrowserWindow

  constructor(config: ClaudeApiConfig, toolRegistry: ToolRegistry, mainWindow?: BrowserWindow) {
    super({
      apiKey: config.apiKey,
      model: config.model || 'claude-3-5-sonnet-latest'
    })
    this.toolRegistry = toolRegistry
    this.mainWindow = mainWindow
  }

  /**
   * Initialize the provider with the latest configuration
   */
  init(): void {
    // Configuration is handled by constructor and updateConfig
  }

  /**
   * Update window reference if needed
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * Parse a tool call from Claude's response
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
   * Execute a confirmed tool call and send the result back to the LLM
   */
  async executeToolCall(
    callId: string, 
    modifiedArgs?: Record<string, unknown>,
    conversationId?: string
  ): Promise<AsyncIterable<string>> {
    const pendingCall = this.getPendingToolCall(callId)
    if (!pendingCall) {
      throw new Error(`Tool call with ID ${callId} not found`)
    }

    const { toolName, args, serverId, conversationId: storedConversationId } = pendingCall
    const argsToUse = modifiedArgs || args
    const convId = conversationId || storedConversationId
    
    if (!convId) {
      throw new Error('Conversation ID is required for executing tool calls')
    }

    try {
      // Notify UI if window is provided
      if (this.mainWindow) {
        this.mainWindow.webContents.send('claude:executing-tool', {
          toolName,
          args: argsToUse
        })
      }

      console.log(`Executing tool ${toolName} on server ${serverId} with args:`, argsToUse)
      
      // Execute the tool call through the registry
      const result = await this.toolRegistry.callTool(serverId, toolName, argsToUse)
      console.log(`Tool ${toolName} execution result:`, result)

      // Create a serializable version of the result
      const serializableResult = JSON.parse(JSON.stringify(result))
      console.log(`Serializable result:`, serializableResult)

      // Notify UI of completion
      if (this.mainWindow) {
        this.mainWindow.webContents.send('claude:tool-result', {
          toolName,
          result: serializableResult
        })
      }

      // Remove the pending call
      this.removePendingToolCall(callId)

      // Generate a response for Claude based on the tool result
      const toolResultMessage = `I executed the ${toolName} tool with the provided arguments, and here is the result:\n\n${JSON.stringify(serializableResult, null, 2)}`
      
      // Add tool result to conversation history
      this.addMessageToConversation(convId, {
        role: 'tool',
        content: JSON.stringify(serializableResult),
        name: toolName
      })

      // Send the result back to Claude for further processing
      const systemPrompt = `You previously attempted to call the ${toolName} tool. The tool has been executed and the results are provided. Please analyze these results and respond accordingly.`
      
      // Send the result back to Claude with the conversation history
      return this.sendMessage(toolResultMessage, { 
        systemPrompt, 
        conversationId: convId 
      })
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error)
      
      // Remove the pending call even if it failed
      this.removePendingToolCall(callId)
      
      // Generate error response
      const errorMessage = `I attempted to execute the ${toolName} tool but encountered an error: ${error instanceof Error ? error.message : String(error)}`
      
      // Add error message to conversation history
      this.addMessageToConversation(convId, {
        role: 'tool',
        content: errorMessage,
        name: toolName
      })
      
      // Send the error back to Claude
      const systemPrompt = `You previously attempted to call the ${toolName} tool but there was an error. Please suggest an alternative approach.`
      return this.sendMessage(errorMessage, { 
        systemPrompt, 
        conversationId: convId 
      })
    }
  }

  /**
   * Send a message to Claude with tools from the tool registry
   */
  async sendMessage(
    message: string,
    options?: {
      systemPrompt?: string;
      conversationId?: string;
    }
  ): Promise<AsyncIterable<string>> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured')
    }

    const anthropic = createAnthropic({
      apiKey: this.apiKey
    })

    // Get all available tools from the registry
    const allServerTools = this.toolRegistry.getAllTools()
    const allTools: McpTool[] = allServerTools.flatMap((serverTools) => serverTools.tools)

    // Get or create conversation
    const conversation = this.getOrCreateConversation(options?.conversationId)
    console.log(`sendMessage using conversation ID: ${conversation.id}`)

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
            const serverId = this.toolRegistry.findServerWithTool(t.name)
            if (!serverId) {
              return [
                {
                  type: 'text',
                  text: `Error: Tool ${t.name} not found on any connected server`
                }
              ]
            }

            // Create a pending tool call that needs user confirmation
            const callId = this.createPendingToolCall(t.name, args as Record<string, unknown>, serverId, conversation.id)

            // Notify UI about the tool call that needs confirmation
            if (this.mainWindow) {
              this.mainWindow.webContents.send('claude:tool-call-pending', {
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

    // Prepare messages array for Claude
    const messagesForClaude: CoreMessage[] = conversation.messages.map(toLlmSdkMessage)
    
    // Add system message if provided (as the first message)
    if (options?.systemPrompt) {
      messagesForClaude.unshift({
        role: 'system',
        content: options.systemPrompt
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