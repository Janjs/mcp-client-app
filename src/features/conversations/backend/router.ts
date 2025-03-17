import { BrowserWindow, ipcMain } from "electron";
import {
  CONVERSATIONS_CHANNELS,
  Conversation,
  LLM_CHANNELS,
  SendMessageParams,
  ToolCallUserResponse,
} from "../types";
import { CoreMessage, CoreToolMessage, ToolResultPart } from "ai";
import { getEventContext } from "@core/events/handleEvent";
import { getConversationsQuery } from "./queries/getConversations";
import {
  getConversationQuery,
  invalidateConversationQuery,
} from "./queries/getConversation";
import { createConversationMutation } from "./mutations/createConversation";
import { updateConversationMutation } from "./mutations/updateConversation";
import { deleteConversationMutation } from "./mutations/deleteConversation";
import {
  addMessageMutation,
  addMessagesMutation,
} from "./mutations/addMessage";
import { getMessageService } from "./services/message-service";
import { getToolService } from "./services/tool-service";

const router = ipcMain;

function notifyMessageAdded(
  window: BrowserWindow,
  vaultId: string,
  conversationId: string,
  message: CoreMessage,
) {
  invalidateConversationQuery(vaultId, conversationId);

  window.webContents.send(CONVERSATIONS_CHANNELS.MESSAGE_ADDED, {
    conversationId,
    message,
  });
}

/**
 * Sets up IPC handlers for conversation operations
 */
export function setupRouter(): void {
  // Get all conversations
  router.handle(CONVERSATIONS_CHANNELS.GET_CONVERSATIONS, async (event) => {
    try {
      const { vault } = await getEventContext(event);
      if (!vault) {
        throw new Error("No active vault found");
      }

      return await getConversationsQuery(vault.path);
    } catch (error) {
      console.error("Failed to get conversations:", error);
      return [];
    }
  });

  // Get a conversation by ID
  router.handle(
    CONVERSATIONS_CHANNELS.GET_CONVERSATION,
    async (event, conversationId: string) => {
      try {
        const { vault } = await getEventContext(event);
        if (!vault) {
          throw new Error("No active vault found");
        }

        return await getConversationQuery(vault, conversationId);
      } catch (error) {
        console.error(`Failed to get conversation ${conversationId}:`, error);
        return null;
      }
    },
  );

  // Create a new conversation
  router.handle(
    CONVERSATIONS_CHANNELS.CREATE_CONVERSATION,
    async (event, name: string) => {
      try {
        const { vault } = await getEventContext(event);
        if (!vault) {
          throw new Error("No active vault found");
        }

        return await createConversationMutation(vault.path, name);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        return null;
      }
    },
  );

  // Update a conversation
  router.handle(
    CONVERSATIONS_CHANNELS.UPDATE_CONVERSATION,
    async (event, conversationId: string, updates: Partial<Conversation>) => {
      try {
        const { vault } = await getEventContext(event);
        if (!vault) {
          throw new Error("No active vault found");
        }

        return await updateConversationMutation(vault, conversationId, updates);
      } catch (error) {
        console.error(
          `Failed to update conversation ${conversationId}:`,
          error,
        );
        return false;
      }
    },
  );

  // Delete a conversation
  router.handle(
    CONVERSATIONS_CHANNELS.DELETE_CONVERSATION,
    async (event, conversationId: string) => {
      try {
        const { vault } = await getEventContext(event);
        if (!vault) {
          throw new Error("No active vault found");
        }

        return await deleteConversationMutation(vault, conversationId);
      } catch (error) {
        console.error(
          `Failed to delete conversation ${conversationId}:`,
          error,
        );
        return false;
      }
    },
  );

  // Add a message to a conversation
  router.handle(
    CONVERSATIONS_CHANNELS.ADD_MESSAGE,
    async (event, conversationId: string, message: CoreMessage) => {
      try {
        const { vault } = await getEventContext(event);
        if (!vault) {
          throw new Error("No active vault found");
        }

        return await addMessageMutation(vault, conversationId, message);
      } catch (error) {
        console.error(
          `Failed to add message to conversation ${conversationId}:`,
          error,
        );
        return false;
      }
    },
  );

  // Listen for vault changes to invalidate conversation caches
  router.on("vault:active-changed", (_event, windowId: number) => {
    console.log(
      `Vault changed for window ${windowId}, refreshing conversations...`,
    );
    // The cache will be refreshed on next query
  });

  // Handler for sending a message to an LLM
  router.handle(
    LLM_CHANNELS.SEND_MESSAGE,
    async (_event, params: SendMessageParams) => {
      try {
        const { window, vault } = await getEventContext(_event);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const conversation = await getConversationQuery(
          vault,
          params.conversationId,
        );
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        const messages = conversation.messages;

        await addMessageMutation(vault, params.conversationId, params.message);
        await notifyMessageAdded(
          window as BrowserWindow,
          vault.id,
          params.conversationId,
          params.message,
        );

        const messageService = await getMessageService(vault.path, vault.id);
        // Send the message to the LLM service and stream the response
        await messageService.sendMessage(
          params,
          messages,
          // Message stream event handler
          (event) => {
            console.log("Message stream event:", event);
            window.webContents.send(LLM_CHANNELS.MESSAGE_STREAM, event);
          },
          // Tool call event handler
          (event) => {
            console.log("Tool call event:", event);
            window.webContents.send(LLM_CHANNELS.TOOL_CALL, event);
          },
          // Message completion event handler
          async (event) => {
            console.log("Message completion event:", event);

            await addMessagesMutation(
              vault,
              params.conversationId,
              event.responseMessages,
            );

            const lastMessage =
              event.responseMessages[event.responseMessages.length - 1];

            window.webContents.send(LLM_CHANNELS.MESSAGE_COMPLETION, event);

            await notifyMessageAdded(
              window as BrowserWindow,
              vault.id,
              params.conversationId,
              lastMessage,
            );
          },
          // Error event handler
          (event) => {
            console.log("Message error event:", event);
            window.webContents.send(LLM_CHANNELS.MESSAGE_ERROR, event);
          },
        );

        return true;
      } catch (error) {
        console.error("Error in sendMessage handler:", error);

        // Notify the renderer about the error
        const { window } = await getEventContext(_event);
        if (!window) {
          throw new Error("No active window found");
        }

        window.webContents.send(LLM_CHANNELS.MESSAGE_ERROR, {
          conversationId: params.conversationId,
          messageId: params.messageId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    },
  );

  // Handler for sending a response to a tool call
  router.handle(
    LLM_CHANNELS.TOOL_CALL_RESPONSE,
    async (event, params: ToolCallUserResponse) => {
      try {
        // Get the main window
        const { vault } = await getEventContext(event);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const toolService = await getToolService(vault.id);
        const conversation = await getConversationQuery(
          vault,
          params.conversationId,
        );

        if (!conversation) {
          throw new Error("Conversation not found");
        }

        // 1. get user confirmation result
        // 2. If user denied, respond with a tool message saying the user denied the tool call
        // 3. If the user allowed it, execute the tool from the correct mcp server
        // 4. Send the result back to the frontend in the shape of a tool result message
        // 5. The frontend will capture this tool call result and re-spawn the conversation
        // 6. The LLM will see the tool call result and continue the conversation
        const toolCall = await toolService.findToolCall(
          params.toolCallId,
          conversation,
        );

        if (!toolCall) {
          throw new Error("Tool call not found");
        }

        if (!params.approved) {
          return {
            role: "tool",
            content: [
              {
                type: "tool-result",
                toolCallId: params.toolCallId,
                toolName: toolCall.toolName,
                result: {
                  error: "User denied the tool call",
                },
                isError: true,
              } as ToolResultPart,
            ],
          } as CoreToolMessage;
        }

        console.log("pre-execute tool", params);

        // const toolService = await getToolService(vault.id);
        const result = await toolService.executeToolCall(
          toolCall,
          params.args ?? {},
        );

        console.log(
          "respondToToolCall result",
          JSON.stringify(result, null, 2),
        );

        const toolResult = {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: params.toolCallId,
              toolName: toolCall.toolName,
              result,
            } as ToolResultPart,
          ],
        } as CoreToolMessage;

        return toolResult;
      } catch (error) {
        console.error("Error in respondToToolCall handler:", error);
        throw error;
      }
    },
  );
}

/**
 * Removes IPC handlers for conversation operations
 */
export function removeRouter(): void {
  router.removeHandler(CONVERSATIONS_CHANNELS.GET_CONVERSATIONS);
  router.removeHandler(CONVERSATIONS_CHANNELS.GET_CONVERSATION);
  router.removeHandler(CONVERSATIONS_CHANNELS.CREATE_CONVERSATION);
  router.removeHandler(CONVERSATIONS_CHANNELS.UPDATE_CONVERSATION);
  router.removeHandler(CONVERSATIONS_CHANNELS.DELETE_CONVERSATION);
  router.removeHandler(CONVERSATIONS_CHANNELS.ADD_MESSAGE);
}
