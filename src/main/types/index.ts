// Common types used across the application

// --------------------------------
// MCP Types
// --------------------------------

// MCP Server configuration
export interface McpServerConfig {
  id: string;
  name: string;
  serverPath: string;
  args: string[];
  autoConnect: boolean;
}

// MCP tool interface
export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

// MCP tool content returned from tool execution
export interface McpToolContent {
  type: string;
  text?: string;
  content?: unknown;
}

// --------------------------------
// LLM Types
// --------------------------------

// LLM messages with role and content
export interface LlmMessage {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  name?: string;
}

// LLM conversation containing history
export interface LlmConversation {
  id: string;
  messages: LlmMessage[];
}

// Parsed tool call from LLM response
export interface ParsedToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

// Pending tool call waiting for user confirmation
export interface PendingToolCall {
  callId: string;
  toolName: string;
  args: Record<string, unknown>;
  serverId: string;
  conversationId?: string;
}

// Tool call execution result
export interface ToolCallResult {
  toolName: string;
  result: unknown;
}

// LLM API configuration (generic for any LLM)
export interface LlmConfig {
  apiKey: string;
  model: string;
}

// Claude API configuration (specific to Claude)
export interface ClaudeApiConfig {
  apiKey: string;
  model?: string;
}

// LLM Response with custom additions
export interface LlmResponse {
  text: string;
  toolCalls: ParsedToolCall[];
}

// --------------------------------
// Provider Interface Types
// --------------------------------

// LLM Provider interface - abstraction for different LLM services
export interface LlmProvider {
  init(): void;
  updateConfig(config: Partial<LlmConfig>): void;
  getConfig(): LlmConfig;
  sendMessage(
    message: string,
    options?: {
      systemPrompt?: string;
      conversationId?: string;
    }
  ): Promise<AsyncIterable<string>>;
  createPendingToolCall(
    toolName: string, 
    args: Record<string, unknown>, 
    serverId: string,
    conversationId?: string
  ): string;
  executeToolCall(
    callId: string,
    modifiedArgs?: Record<string, unknown>,
    conversationId?: string
  ): Promise<AsyncIterable<string>>;
  parseToolCall(text: string): ParsedToolCall | null;
}

// Tool Provider interface - abstraction for tool execution
export interface ToolProvider {
  getTools(): McpTool[];
  callTool(toolName: string, args: Record<string, unknown>): Promise<McpToolContent[]>;
}

// Tool Manager interface - abstraction for managing tool providers
export interface ToolManager {
  connectToServer(serverId: string): Promise<boolean>;
  disconnectFromServer(serverId: string): Promise<boolean>;
  disconnectAll(): Promise<void>;
  getAllTools(): { serverId: string; tools: McpTool[] }[];
  getServerTools(serverId: string): McpTool[];
  callTool(serverId: string, toolName: string, args: Record<string, unknown>): Promise<McpToolContent[]>;
  findServerWithTool(toolName: string): string | null;
  isServerConnected(serverId: string): boolean;
  getConnectedServerIds(): string[];
} 