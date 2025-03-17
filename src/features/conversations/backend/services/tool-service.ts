import {
  CoreToolMessage,
  ToolCall,
  ToolCallPart,
  ToolExecutionOptions,
  ToolSet,
  jsonSchema,
  tool,
} from "ai";
import { v4 as uuidv4 } from "uuid";
import { JSONSchema7 } from "json-schema";
import {
  ConnectionTools,
  ExecutableTool,
} from "@features/mcp-servers/types/connection";
import { getMcpConnectionService } from "@features/mcp-servers/backend/services/mcp-connection-service";
import { Conversation } from "@features/conversations/types";

/**
 * Tool Service for managing tools and toolsets for conversation
 */
export class ToolService {
  private vaultId: string;

  constructor(vaultId: string) {
    this.vaultId = vaultId;
  }

  public findToolCall(toolCallId: string, conversation: Conversation) {
    const toolCalls = conversation.messages.reduce((acc, message) => {
      if (message.role === "assistant" && Array.isArray(message.content)) {
        const toolCalls = message.content.filter(
          (content) => content.type === "tool-call",
        );
        acc.push(...toolCalls);
      }
      return acc;
    }, [] as ToolCallPart[]);

    return toolCalls.find((toolCall) => toolCall.toolCallId === toolCallId);
  }

  /**
   * Maps tools to AI SDK ToolSet format
   */
  public mapToolsToToolSet(
    tools: ConnectionTools,
    onToolCall: (toolCall: ToolCall<string, Record<string, unknown>>) => void,
  ): ToolSet {
    return tools.reduce((acc, t) => {
      acc[t.name] = tool({
        description: t.description || "",
        parameters: jsonSchema(t.inputSchema as JSONSchema7),
        execute: async (args: unknown, _options: ToolExecutionOptions) => {
          console.log("Executing tool:", t.name, args);

          // Generate a unique ID for this tool call
          const toolCallId = uuidv4();

          // Notify about the tool call
          onToolCall({
            toolCallId,
            toolName: t.name,
            args: args as Record<string, unknown>,
          } as ToolCall<string, Record<string, unknown>>);
        },
      });

      return acc;
    }, {} as ToolSet);
  }

  /**
   * Get all available tools from connected MCP servers
   */
  public async getAvailableTools(): Promise<ConnectionTools> {
    const connections = getMcpConnectionService().getConnections(this.vaultId);

    // Filter for connected servers and collect their tools
    const allTools: ConnectionTools = [];

    for (const connection of connections) {
      // Skip if not connected
      if (!connection.info.status || connection.info.status !== "CONNECTED") {
        continue;
      }

      // Get tools from the server if available
      if (connection.info.tools) {
        allTools.push(...connection.info.tools);
      }
    }

    return allTools;
  }

  /**
   * Get executable tools from connected MCP servers
   */
  public async getExecutableTools(): Promise<ExecutableTool[]> {
    const connections = getMcpConnectionService().getConnections(this.vaultId);

    // Filter for connected servers and collect their tools
    const allTools: ExecutableTool[] = [];

    for (const connection of connections) {
      // Skip if not connected
      if (!connection.info.status || connection.info.status !== "CONNECTED") {
        continue;
      }

      if (connection.info.tools) {
        allTools.push(
          ...connection.info.tools.map((tool) => ({
            ...tool,
            execute: async (args: unknown) => {
              const client = getMcpConnectionService().getClient(
                this.vaultId,
                connection.serverId,
              );
              if (!client) {
                throw new Error(
                  `Client not found for connection ${connection.serverId}`,
                );
              }
              console.log(`calling tool ${tool.name} with arguments`, args);
              return client.callTool({
                name: tool.name,
                arguments: args as Record<string, unknown>,
              });
            },
          })),
        );
      }
    }

    return allTools;
  }

  /**
   * Respond to a tool call with user provided response
   */
  public async executeToolCall(
    toolCall: ToolCallPart,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    console.log("executeToolCall", { toolCall, args });

    // 1. get the tool from the available tools
    // 2. execute the tool with the user arguments
    // 3. return the result

    const tools = await this.getExecutableTools();
    const tool = tools.find((t) => t.name === toolCall.toolName);
    if (!tool) {
      return {
        error: `Tool ${toolCall.toolName} not found`,
      };
    }

    try {
      const toolCallResult = await tool.execute(args);
      return toolCallResult;
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}

// Singleton pattern for ToolService
const toolServiceInstances = new Map<string, ToolService>();

/**
 * Get the ToolService for a vault or create one if it doesn't exist
 */
export function getToolService(vaultId: string): ToolService {
  if (!toolServiceInstances.has(vaultId)) {
    const service = new ToolService(vaultId);
    toolServiceInstances.set(vaultId, service);
  }

  return toolServiceInstances.get(vaultId)!;
}
