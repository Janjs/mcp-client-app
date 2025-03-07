import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useMcp } from '../hooks/useMcp'
import claudeService from '../services/ClaudeService'
import ToolCallConfirmation from './ToolCallConfirmation'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type PendingToolCall = {
  callId: string
  toolName: string
  args: Record<string, unknown>
  serverId: string
  conversationId?: string
}

const Chat = (): JSX.Element => {
  const { isConnected, isConnecting, connect } = useMcp()
  const [serverPath, setServerPath] = useState('/Users/reginaldo/code/claude-3-7-tests/todo-list-mcp/dist/index.js') // Pre-filled for convenience
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [pendingToolCall, setPendingToolCall] = useState<PendingToolCall | null>(null)
  
  // Set up Claude service event listeners
  useEffect(() => {
    // Listen for message chunks from Claude
    const unsubscribeChunk = claudeService.onMessageChunk((chunk) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          const updatedMessages = [...prev]
          updatedMessages[prev.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + chunk
          }
          return updatedMessages
        }
        return prev
      })
    })
    
    // Listen for message completion events from Claude
    const unsubscribeComplete = claudeService.onMessageComplete(() => {
      setIsLoading(false)
    })
    
    // Listen for errors from Claude
    const unsubscribeError = claudeService.onError((error) => {
      console.error('Claude error:', error)
      setIsLoading(false)
      
      // Update the last message with the error if it's from the assistant
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          const updatedMessages = [...prev]
          updatedMessages[prev.length - 1] = {
            ...lastMessage,
            content: `Error: ${error}`
          }
          return updatedMessages
        }
        return prev
      })
    })

    // Listen for tool call pending confirmation
    const unsubscribeToolCallPending = claudeService.onToolCallPending((data) => {
      console.log('Tool call pending confirmation:', data)
      console.log('Conversation ID in pending tool call:', data.conversationId)
      setPendingToolCall(data)
    })

    // Listen for tool call rejected
    const unsubscribeToolCallRejected = claudeService.onToolCallRejected((data) => {
      console.log('Tool call rejected:', data)
      // Add a system message about the rejection
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Tool call '${data.toolName}' was rejected${data.reason ? `: ${data.reason}` : ''}.`
        }
      ])
    })
    
    // Clean up subscriptions
    return () => {
      unsubscribeChunk()
      unsubscribeComplete()
      unsubscribeError()
      unsubscribeToolCallPending()
      unsubscribeToolCallRejected()
    }
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle tool call confirmation
  const handleConfirmToolCall = async (callId: string, modifiedArgs: Record<string, unknown>): Promise<void> => {
    setPendingToolCall(null)
    
    // Add a message indicating the tool is being executed
    const toolInfo = pendingToolCall
    if (toolInfo) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Executing tool '${toolInfo.toolName}' with${
            modifiedArgs !== toolInfo.args ? ' modified' : ''
          } arguments...`
        }
      ])
      
      // Execute the tool
      try {
        setIsLoading(true)
        
        // Sanitize arguments before sending to make sure they're serializable
        const sanitizedArgs = JSON.parse(JSON.stringify(modifiedArgs))
        
        console.log(`Confirming tool call ${callId} with conversation ID ${toolInfo.conversationId || 'unknown'}`)
        
        // The response from executeToolCall will be a new LLM stream
        // It will be handled by the existing message chunk handler
        await claudeService.confirmToolCall(callId, sanitizedArgs, toolInfo.conversationId)
      } catch (error) {
        console.error('Error executing tool call:', error)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ])
        setIsLoading(false)
      }
    } else {
      console.error('No pending tool call found when confirming')
      setIsLoading(false)
    }
  }

  // Handle tool call rejection
  const handleRejectToolCall = async (callId: string, reason?: string): Promise<void> => {
    setPendingToolCall(null)
    
    try {
      await claudeService.rejectToolCall(callId, reason)
    } catch (error) {
      console.error('Error rejecting tool call:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error rejecting tool: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ])
    }
  }

  const handleConnect = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!serverPath.trim()) return

    try {
      const nodePath = 'node' // Using just 'node' will use the system node
      await connect(nodePath, [serverPath])
    } catch (error) {
      console.error('Error connecting to MCP server:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Failed to connect to MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!input.trim() || !isConnected || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: ''
      }
    ])

    // Send message to Claude through our service
    try {
      const systemPrompt = 'You are Claude, an AI assistant. Please use the MCP tools available to help the user. Keep your responses concise yet helpful.';
      await claudeService.sendMessage(input, systemPrompt);
      // The response will be handled by the event listeners we set up
    } catch (error) {
      console.error('Error sending message to Claude:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection form */}
      <div className="p-4 bg-gray-100 border-b">
        <form onSubmit={handleConnect} className="flex gap-2">
          <input
            type="text"
            value={serverPath}
            onChange={(e) => setServerPath(e.target.value)}
            placeholder="MCP Server path"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={isConnecting || isConnected}
            className={`px-4 py-2 rounded ${
              isConnecting || isConnected
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
          </button>
        </form>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-8'
                : 'bg-gray-100 mr-8'
            }`}
          >
            <div className="font-semibold mb-1">
              {message.role === 'user' ? 'You' : 'Claude'}
            </div>
            <div className="whitespace-pre-wrap">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isConnected
                ? 'Type your message...'
                : 'Connect to MCP server first'
            }
            disabled={!isConnected || isLoading}
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={!isConnected || isLoading}
            className={`px-4 py-2 rounded ${
              !isConnected || isLoading
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Tool Call Confirmation Dialog */}
      {pendingToolCall && (
        <ToolCallConfirmation
          callId={pendingToolCall.callId}
          toolName={pendingToolCall.toolName}
          args={pendingToolCall.args}
          onConfirm={handleConfirmToolCall}
          onReject={handleRejectToolCall}
        />
      )}
    </div>
  )
}

export default Chat 