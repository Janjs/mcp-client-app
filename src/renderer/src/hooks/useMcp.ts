import { useContext } from 'react'
import { McpContext, McpContextType } from '../contexts/McpContextDefinition'

export const useMcp = (): McpContextType => {
  const context = useContext(McpContext)
  if (context === undefined) {
    throw new Error('useMcp must be used within a McpProvider')
  }
  return context
} 