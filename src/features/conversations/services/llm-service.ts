import {
  CoreMessage,
  streamText,
  ToolSet,
  tool,
  jsonSchema,
  ToolCall,
  ToolExecutionOptions,
} from "ai";
import { AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";
import {
  ConfiguredProvider,
  ModelRegistry,
} from "@features/models/types/models";
import { getModelsRegistry } from "@features/models/services/models-service";
import {
  getClient,
  getConnections,
} from "@features/mcp-servers/backend/mcp-connection-manager";
import {
  ConnectionTools,
  ExecutableTool,
} from "@features/mcp-servers/types/connection";
import { JSONSchema7 } from "json-schema";
import {
  MessageCompletionEvent,
  MessageErrorEvent,
  MessageStreamEvent,
  SendMessageParams,
  ToolCallEvent,
  ToolCallUserResponse,
} from "../types";
import { v4 as uuidv4 } from "uuid";

type AcceptedProviders = AnthropicProvider | OpenAIProvider;

function mapToolsToToolSet(
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
 * LLM Service class for handling interactions with AI providers
 */
export class LlmService {
  private vaultPath: string;
  private vaultId: string;
  private modelRegistry: ModelRegistry | null = null;

  constructor(vaultPath: string, vaultId: string) {
    this.vaultPath = vaultPath;
    this.vaultId = vaultId;
  }

  /**
   * Initialize the LLM service
   */
  public async initialize(): Promise<void> {
    this.modelRegistry = await getModelsRegistry(this.vaultPath);
  }

  /**
   * Get the provider client based on provider name
   */
  private getProviderClient(providerName: string): AcceptedProviders {
    if (!this.modelRegistry) {
      throw new Error("Model registry not initialized");
    }

    const provider = this.modelRegistry.providers.find(
      (p) => p.provider === providerName,
    );

    if (!provider) {
      throw new Error(`Provider ${providerName} not found in registry`);
    }

    return this.createProviderClient(provider);
  }

  /**
   * Create a provider client based on provider configuration
   */
  private createProviderClient(
    provider: ConfiguredProvider,
  ): AcceptedProviders {
    const { apiKey, baseUrl } = provider.settings;

    if (!apiKey) {
      throw new Error(`API key not found for provider ${provider.provider}`);
    }

    switch (provider.provider) {
      case "openai":
        return createOpenAI({
          apiKey,
          baseURL: baseUrl || undefined,
        });
      case "anthropic":
        return createAnthropic({
          apiKey,
          baseURL: baseUrl || undefined,
        });
      default:
        throw new Error(`Unsupported provider: ${provider.provider}`);
    }
  }

  /**
   * Get all available tools from connected MCP servers
   */
  private async getAvailableTools(vaultId: string): Promise<ConnectionTools> {
    const connections = getConnections(vaultId);

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

  public async getExecutableTools(vaultId: string): Promise<ExecutableTool[]> {
    const connections = getConnections(vaultId);

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
              const client = getClient(vaultId, connection.serverId);
              if (!client) {
                throw new Error(
                  `Client not found for connection ${connection.serverId}`,
                );
              }
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
   * Send a message to the AI provider and stream the response
   */
  public async sendMessage(
    sendMessageParams: SendMessageParams,
    messages: CoreMessage[],
    onChunk: (event: MessageStreamEvent) => void,
    onToolCall: (event: ToolCallEvent) => void,
    onCompletion: (event: MessageCompletionEvent) => Promise<void>,
    onError: (event: MessageErrorEvent) => void,
  ): Promise<void> {
    try {
      // Get the provider client
      const providerClient = this.getProviderClient(
        sendMessageParams.providerName,
      );

      // Get available tools
      const tools = await this.getAvailableTools(this.vaultId);

      console.log("debug", {
        tools,
        providerClient,
        modelName: sendMessageParams.modelName,
        message: sendMessageParams.message,
      });

      const systemPrompt = `
      # Core Behavior

      You are a helpful assistant that can execute tools.
      You are also able to answer general questions, you are not required to use tools for this.
      You shouldn't even mention the tools you have available, unless the user asks for them.
      When you see the need to use a tool, just use it.
      Respond the user in the same language they speak.
      `;
      const systemMessage: CoreMessage = {
        role: "system",
        content: systemPrompt,
      };

      const newMessages = [
        systemMessage,
        ...messages,
        sendMessageParams.message,
      ];

      // Stream the response
      const { textStream } = await streamText({
        model: providerClient(sendMessageParams.modelName),
        messages: newMessages,
        toolChoice: "auto",
        tools: mapToolsToToolSet(tools, (toolCall) => {
          // Notify about the tool call
          onToolCall({
            conversationId: sendMessageParams.conversationId,
            messageId: sendMessageParams.messageId,
            responseId: sendMessageParams.responseId,
            toolCall,
          });
        }),
        onError: (error) => {
          console.error("Error streaming text:", error);
          onError({
            conversationId: sendMessageParams.conversationId,
            messageId: sendMessageParams.messageId,
            responseId: sendMessageParams.responseId,
            error: error instanceof Error ? error.message : String(error),
          });
        },
        onFinish: ({ response }) => {
          console.log("onFinish", { response });
          // Handle completion
          if (response.messages && response.messages.length > 0) {
            // May need to save the whole message, not sure yet.

            // Add all messages to the conversation
            onCompletion({
              conversationId: sendMessageParams.conversationId,
              messageId: sendMessageParams.messageId,
              responseId: sendMessageParams.responseId,
              responseMessages: response.messages.filter(
                (m) => m.role !== "tool",
              ),
            }).then(() => {
              console.log("message completion event sent");
            });
          }
        },
      });

      console.log("starting to process chunks");
      // Process the stream
      for await (const chunk of textStream) {
        console.log("processing chunk", { chunk });
        const chunkId = uuidv4(); // I hope this is not too costly
        // Send each chunk to the renderer
        onChunk({
          conversationId: sendMessageParams.conversationId,
          messageId: sendMessageParams.messageId,
          responseId: sendMessageParams.responseId,
          chunk: {
            id: chunkId,
            content: chunk,
          },
        });
      }

      console.log("finished processing chunks");
    } catch (error) {
      console.error("Error sending message:", error);
      onError({
        conversationId: sendMessageParams.conversationId,
        messageId: sendMessageParams.messageId,
        responseId: sendMessageParams.responseId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async respondToToolCall(
    params: ToolCallUserResponse,
  ): Promise<unknown> {
    console.log("respondToToolCall", params);

    const { toolCallId, result } = params;

    // 1. get the tool from the available tools
    // 2. execute the tool with the user arguments
    // 3. return the result

    const tools = await this.getExecutableTools(this.vaultId);
    const tool = tools.find((t) => t.name === toolCallId);
    if (!tool) {
      throw new Error(`Tool ${toolCallId} not found`);
    }

    const toolCallResult = await tool.execute(result ?? {});
    return toolCallResult;
  }
}

/**
 * LLM service instances cache
 */
const llmServices = new Map<string, LlmService>();

/**
 * Get the LLM service for a vault path or create one if it doesn't exist
 */
export async function getLlmService(
  vaultPath: string,
  vaultId: string,
): Promise<LlmService> {
  if (!llmServices.has(vaultPath)) {
    const service = new LlmService(vaultPath, vaultId);
    console.log("Initializing LLM service for vault:", vaultPath);
    await service.initialize().catch(console.error);
    llmServices.set(vaultPath, service);
  }

  return llmServices.get(vaultPath)!;
}
