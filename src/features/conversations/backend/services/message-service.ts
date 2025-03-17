import { CoreMessage, streamText } from "ai";
import { AnthropicProvider, createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";
import {
  ConfiguredProvider,
  ModelRegistry,
} from "@features/models/types/models";
import { getModelsRegistry } from "@features/models/backend/services/models-service";
import { v4 as uuidv4 } from "uuid";
import {
  MessageCompletionEvent,
  MessageErrorEvent,
  MessageStreamEvent,
  SendMessageParams,
  ToolCallEvent,
} from "../../types";
import { getToolService } from "./tool-service";

// Type for accepted providers
type AcceptedProviders = AnthropicProvider | OpenAIProvider;

/**
 * Message Service for handling message sending to LLM providers
 */
export class MessageService {
  private vaultPath: string;
  private vaultId: string;
  private modelRegistry: ModelRegistry | null = null;

  constructor(vaultPath: string, vaultId: string) {
    this.vaultPath = vaultPath;
    this.vaultId = vaultId;
  }

  /**
   * Initialize the service
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

      // Get the tool service
      const toolService = getToolService(this.vaultId);

      // Get available tools
      const tools = await toolService.getAvailableTools();

      console.log("debug", {
        tools,
        providerClient,
        modelName: sendMessageParams.modelName,
        message: sendMessageParams.message,
      });

      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const systemPrompt = `
      # Initialization

      Current Date: ${today}

      # Core Behavior

      You are a helpful assistant that can execute tools.
      You are also able to answer general questions, you are not required to use tools for this.
      You shouldn't even mention the tools you have available, unless the user asks for them.
      When you see the need to use a tool, just use it.
      Respond the user in the same language they speak.

      # Formatting

      Use markdown formatting. CommonMark and GFM are both acceptable.
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
        tools: toolService.mapToolsToToolSet(tools, (toolCall) => {
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
            const allResponseMessages = response.messages;
            console.log(
              "allResponseMessages",
              JSON.stringify(allResponseMessages, null, 2),
            );

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
}

/**
 * Message service instances cache
 */
const messageServices = new Map<string, MessageService>();

/**
 * Get the Message service for a vault or create one if it doesn't exist
 */
export async function getMessageService(
  vaultPath: string,
  vaultId: string,
): Promise<MessageService> {
  const key = `${vaultPath}:${vaultId}`;
  if (!messageServices.has(key)) {
    const service = new MessageService(vaultPath, vaultId);
    await service.initialize().catch(console.error);
    messageServices.set(key, service);
  }

  return messageServices.get(key)!;
}
