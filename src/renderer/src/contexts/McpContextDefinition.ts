import { createContext } from 'react'

export type McpContextType = {
  isConnected: boolean
  isConnecting: boolean
  connect: (serverPath: string, args?: string[]) => Promise<void>
  disconnect: () => Promise<void>
  sendMessage: (message: string) => Promise<AsyncGenerator<string, void, unknown>>
}

export const McpContext = createContext<McpContextType | undefined>(undefined) 