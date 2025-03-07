import { BrowserWindow } from 'electron'
import { ClaudeApiConfig, LlmProvider } from '../../types'
import { ClaudeLlmProvider } from './ClaudeLlmProvider'
import { ToolRegistry } from '../tool/ToolRegistry'

export enum LlmProviderType {
  CLAUDE = 'claude',
  // Future providers can be added here
}

/**
 * Factory for creating LLM providers
 */
export class LlmProviderFactory {
  /**
   * Create an LLM provider instance based on type
   */
  static createProvider(
    type: LlmProviderType,
    config: unknown,
    toolRegistry: ToolRegistry,
    mainWindow?: BrowserWindow
  ): LlmProvider {
    switch (type) {
      case LlmProviderType.CLAUDE:
        return new ClaudeLlmProvider(config as ClaudeApiConfig, toolRegistry, mainWindow)
      default:
        throw new Error(`Unsupported LLM provider type: ${type}`)
    }
  }
}