import { useState, ReactNode, useEffect, useCallback } from 'react'
import mcpService from '../services/McpService'
import { McpContext } from './McpContextDefinition'
import type { McpContextType } from './McpContextDefinition'

export const McpProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // Clean up on component unmount
  useEffect((): (() => void) => {
    return () => {
      mcpService.disconnect().catch(console.error)
    }
  }, [])

  // Update connected state based on service
  useEffect(() => {
    setIsConnected(mcpService.isClientConnected())
  }, [])

  const connect = async (serverPath: string, args: string[] = []): Promise<void> => {
    if (isConnected || isConnecting) return

    setIsConnecting(true)
    try {
      await mcpService.connect(serverPath, args)
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to connect to MCP server:', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async (): Promise<void> => {
    if (!isConnected) return

    try {
      await mcpService.disconnect()
      setIsConnected(false)
    } catch (error) {
      console.error('Failed to disconnect from MCP server:', error)
    }
  }

  // This function will handle sending messages and provide a streaming response
  const sendMessage = useCallback(async (message: string): Promise<AsyncGenerator<string, void, unknown>> => {
    if (!isConnected) {
      throw new Error('Not connected to MCP server')
    }

    // Create a generator that streams the response
    async function* generateResponse(): AsyncGenerator<string, void, unknown> {
      let responseComplete = false
      let buffer = ''
      
      // Set up a message listener
      const unsubscribe = mcpService.onMessage((data) => {
        buffer += data
        
        // Check if the response is complete (you may need to adjust this logic)
        if (data.includes('[DONE]') || data.includes('</final>')) {
          responseComplete = true
          unsubscribe()
        }
      })
      
      // Send the message
      mcpService.sendMessage(message)
      
      // Poll for changes to the buffer
      while (!responseComplete) {
        yield buffer
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Yield the final buffer
      yield buffer
      
      // Clean up
      unsubscribe()
    }

    return generateResponse()
  }, [isConnected])

  const value = {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage
  }

  return <McpContext.Provider value={value}>{children}</McpContext.Provider>
} 