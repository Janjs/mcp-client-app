import { BrowserWindow } from 'electron'
import { ipcRegistry } from './IpcRegistry'
import { configStore } from '../config/store'
import { LlmProvider } from '../types'

/**
 * Register all Claude API related IPC handlers
 */
export function registerClaudeIpcHandlers(
  mainWindow: BrowserWindow,
  llmProvider: LlmProvider
): void {
  // Get Claude API config
  ipcRegistry.registerHandler('claude:get-config', async () => {
    return configStore.getClaudeApiConfig()
  })

  // Update Claude API configuration
  ipcRegistry.registerHandler('claude:update-config', async (_event, apiKey?: string, model?: string) => {
    // Update provider config
    llmProvider.updateConfig({ 
      apiKey: apiKey || llmProvider.getConfig().apiKey,
      model: model || llmProvider.getConfig().model
    })
    
    // Update stored config
    configStore.updateClaudeApiConfig({
      apiKey: apiKey || configStore.getClaudeApiConfig().apiKey,
      model: model || configStore.getClaudeApiConfig().model
    })
    
    return configStore.getClaudeApiConfig()
  })

  // Send a message to Claude
  ipcRegistry.registerHandler('claude:send-message', async (_event, message: string, systemPrompt?: string) => {
    try {
      // Request a response from Claude
      const textStream = await llmProvider.sendMessage(message, {
        systemPrompt
      })

      // Keep track of the complete response to check for tool calls
      let completeResponse = ''

      // Process the async iterable stream
      for await (const chunk of textStream) {
        completeResponse += chunk

        // Send each chunk to the renderer
        ipcRegistry.send(mainWindow, 'claude:message-chunk', chunk)
      }

      // Signal completion when the stream is done
      ipcRegistry.send(mainWindow, 'claude:message-complete')

      // After receiving the complete response, check for tool calls
      const toolCall = llmProvider.parseToolCall(completeResponse)

      // Tool calls should be automatically handled by the AI SDK now,
      // but we can notify the frontend about them for UI purposes
      if (toolCall) {
        ipcRegistry.send(mainWindow, 'claude:detected-tool-call', toolCall)
      }

      return true
    } catch (error) {
      console.error('Error in Claude API message handling:', error)
      ipcRegistry.send(mainWindow, 'claude:error', error instanceof Error ? error.message : String(error))
      throw error
    }
  })

  // Confirm and execute a tool call
  ipcRegistry.registerHandler(
    'claude:confirm-tool-call',
    async (_event, callId: string, modifiedArgs?: Record<string, unknown>, conversationId?: string) => {
      try {
        console.log(`Confirming tool call ${callId} for conversation ${conversationId || 'unknown'}`, modifiedArgs)
        
        // Get the pending tool call details first to log them
        const pendingCall = llmProvider.getPendingToolCall(callId)
        if (!pendingCall) {
          console.error(`Tool call with ID ${callId} not found`)
          mainWindow.webContents.send('claude:error', `Tool call with ID ${callId} not found`)
          return false
        }
        
        console.log(`Tool call details: serverId=${pendingCall.serverId}, toolName=${pendingCall.toolName}, stored conversationId=${pendingCall.conversationId}`)
        
        // Use the conversation ID from the pending call if not provided
        const convId = conversationId || pendingCall.conversationId
        console.log(`Using conversation ID: ${convId}`)
        
        // Since the response will be streamed, we need to handle this differently
        // We'll just initiate the execution here and let the streaming happen through events
        llmProvider.executeToolCall(callId, modifiedArgs, convId)
          .then(async (stream) => {
            try {
              console.log('Started processing tool call result stream')
              // Process the response stream
              for await (const chunk of stream) {
                // Send each chunk back to the renderer
                mainWindow.webContents.send('claude:message-chunk', chunk)
              }
              // Signal completion
              console.log('Finished processing tool call result stream')
              mainWindow.webContents.send('claude:message-complete')
            } catch (streamError) {
              console.error('Error processing tool call result stream:', streamError)
              mainWindow.webContents.send('claude:error', streamError instanceof Error ? streamError.message : String(streamError))
            }
          })
          .catch((error) => {
            console.error('Error initiating tool call execution:', error)
            mainWindow.webContents.send('claude:error', error instanceof Error ? error.message : String(error))
          })
        
        // Return success immediately - the actual results will come through events
        return true
      } catch (error) {
        console.error('Error executing confirmed tool call:', error)
        throw error
      }
    }
  )

  // Reject a tool call
  ipcRegistry.registerHandler(
    'claude:reject-tool-call',
    (_event, callId: string, reason?: string) => {
      try {
        // Get the tool call details
        const toolCall = llmProvider.getPendingToolCall(callId)
        if (!toolCall) {
          throw new Error(`Tool call with ID ${callId} not found`)
        }

        // Remove the pending tool call
        llmProvider.removePendingToolCall(callId)

        // Notify the UI that the tool call was rejected
        mainWindow.webContents.send('claude:tool-call-rejected', {
          callId,
          toolName: toolCall.toolName,
          reason: reason || 'User rejected the tool call'
        })

        return true
      } catch (error) {
        console.error('Error rejecting tool call:', error)
        throw error
      }
    }
  )
} 