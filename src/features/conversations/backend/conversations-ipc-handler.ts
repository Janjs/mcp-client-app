import { BrowserWindow, ipcMain } from "electron";
import {
  ConversationsManager,
  conversationCacheKey,
} from "./conversations-manager";
import {
  CONVERSATIONS_CHANNELS,
  Conversation,
  LLM_CHANNELS,
  SendMessageParams,
  ToolCallUserResponse,
} from "../types";
import { CoreMessage } from "ai";
import { getActiveVault } from "@features/vault/backend/utils";
import { getWindowFromEvent } from "@core/utils/ipc";
import { getLlmService } from "../services/llm-service";
import { cacheManager } from "@core/cache/cache-manager";

/**
 * Map of vault paths to their conversation managers
 * This ensures each vault has a single conversation manager instance
 */
const conversationsManagers = new Map<string, ConversationsManager>();

/**
 * Gets the conversations manager for a vault path or creates one if it doesn't exist
 */
function getConversationsManager(vaultPath: string): ConversationsManager {
  if (!conversationsManagers.has(vaultPath)) {
    conversationsManagers.set(vaultPath, new ConversationsManager(vaultPath));
  }

  return conversationsManagers.get(vaultPath)!;
}

function notifyMessageAdded(
  window: BrowserWindow,
  conversationId: string,
  message: CoreMessage,
) {
  cacheManager.invalidateQueries(conversationCacheKey(conversationId));

  window.webContents.send(CONVERSATIONS_CHANNELS.MESSAGE_ADDED, {
    conversationId,
    message,
  });
}

/**
 * Sets up IPC handlers for conversation operations
 */
export function setupConversationsIpcHandlers(): void {
  // Get all conversations
  ipcMain.handle(
    CONVERSATIONS_CHANNELS.GET_CONVERSATIONS,
    async (event, forceRefresh: boolean = false) => {
      try {
        const window = getWindowFromEvent(event);
        if (!window) {
          throw new Error("No active window found");
        }

        const vault = await getActiveVault(window.id);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const manager = getConversationsManager(vault.path);
        return await manager.getConversations(forceRefresh);
      } catch (error) {
        console.error("Failed to get conversations:", error);
        return [];
      }
    },
  );

  // Get a conversation by ID
  ipcMain.handle(
    CONVERSATIONS_CHANNELS.GET_CONVERSATION,
    async (event, conversationId: string) => {
      try {
        const window = getWindowFromEvent(event);
        if (!window) {
          throw new Error("No active window found");
        }

        const vault = await getActiveVault(window.id);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const manager = getConversationsManager(vault.path);
        return await manager.getConversation(conversationId);
      } catch (error) {
        console.error(`Failed to get conversation ${conversationId}:`, error);
        return null;
      }
    },
  );

  // Create a new conversation
  ipcMain.handle(
    CONVERSATIONS_CHANNELS.CREATE_CONVERSATION,
    async (event, name: string) => {
      try {
        const window = getWindowFromEvent(event);
        if (!window) {
          throw new Error("No active window found");
        }

        const vault = await getActiveVault(window.id);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const manager = getConversationsManager(vault.path);
        return await manager.createConversation(name);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        return null;
      }
    },
  );

  // Update a conversation
  ipcMain.handle(
    CONVERSATIONS_CHANNELS.UPDATE_CONVERSATION,
    async (event, conversationId: string, updates: Partial<Conversation>) => {
      try {
        const window = getWindowFromEvent(event);
        if (!window) {
          throw new Error("No active window found");
        }

        const vault = await getActiveVault(window.id);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const manager = getConversationsManager(vault.path);
        return await manager.updateConversation(conversationId, updates);
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
  ipcMain.handle(
    CONVERSATIONS_CHANNELS.DELETE_CONVERSATION,
    async (event, conversationId: string) => {
      try {
        const window = getWindowFromEvent(event);
        if (!window) {
          throw new Error("No active window found");
        }

        const vault = await getActiveVault(window.id);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const manager = getConversationsManager(vault.path);
        return await manager.deleteConversation(conversationId);
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
  ipcMain.handle(
    CONVERSATIONS_CHANNELS.ADD_MESSAGE,
    async (event, conversationId: string, message: CoreMessage) => {
      try {
        const window = getWindowFromEvent(event);
        if (!window) {
          throw new Error("No active window found");
        }

        const vault = await getActiveVault(window.id);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const manager = getConversationsManager(vault.path);
        return await manager.addMessage(conversationId, message);
      } catch (error) {
        console.error(
          `Failed to add message to conversation ${conversationId}:`,
          error,
        );
        return false;
      }
    },
  );

  // Handle tool call confirmation
  ipcMain.handle(
    CONVERSATIONS_CHANNELS.CONFIRM_TOOL_CALL,
    async (
      event,
      conversationId: string,
      toolCallId: string,
      args: unknown,
    ) => {
      try {
        const window = getWindowFromEvent(event);
        if (!window) {
          throw new Error("No active window found");
        }

        const vault = await getActiveVault(window.id);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const manager = getConversationsManager(vault.path);
        return await manager.executeToolCall(conversationId, toolCallId, args);
      } catch (error) {
        console.error(
          `Failed to execute tool call ${toolCallId} for conversation ${conversationId}:`,
          error,
        );
        return null;
      }
    },
  );

  // Listen for vault changes to invalidate conversation caches
  ipcMain.on("vault:active-changed", (_event, windowId: number) => {
    console.log(
      `Vault changed for window ${windowId}, refreshing conversations...`,
    );
    // The cache will be refreshed on next query
  });

  // Handler for sending a message to an LLM
  ipcMain.handle(
    LLM_CHANNELS.SEND_MESSAGE,
    async (_event, params: SendMessageParams) => {
      try {
        const activeWindow = getWindowFromEvent(_event);
        if (!activeWindow) {
          throw new Error("No active window found");
        }

        const windowId = activeWindow.id;
        if (!windowId) {
          throw new Error("No active window found");
        }
        const vault = await getActiveVault(windowId);
        if (!vault) {
          throw new Error("No active vault found");
        }

        const llmService = await getLlmService(vault.path, vault.id);

        const manager = getConversationsManager(vault.path);

        const conversation = await manager.getConversation(
          params.conversationId,
        );
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        const messages = conversation.messages;

        await manager.addMessage(params.conversationId, params.message);
        await notifyMessageAdded(
          activeWindow as BrowserWindow,
          params.conversationId,
          params.message,
        );

        // Send the message to the LLM service and stream the response
        await llmService.sendMessage(
          params,
          messages,
          // Message stream event handler
          (event) => {
            console.log("Message stream event:", event);
            activeWindow.webContents.send(LLM_CHANNELS.MESSAGE_STREAM, event);
          },
          // Tool call event handler
          (event) => {
            console.log("Tool call event:", event);
            activeWindow.webContents.send(LLM_CHANNELS.TOOL_CALL, event);
          },
          // Message completion event handler
          async (event) => {
            console.log("Message completion event:", event);

            await manager.addMessages(
              params.conversationId,
              event.responseMessages,
            );
            const lastMessage =
              event.responseMessages[event.responseMessages.length - 1];

            activeWindow.webContents.send(
              LLM_CHANNELS.MESSAGE_COMPLETION,
              event,
            );

            await notifyMessageAdded(
              activeWindow as BrowserWindow,
              params.conversationId,
              lastMessage,
            );
          },
          // Error event handler
          (event) => {
            console.log("Message error event:", event);
            activeWindow.webContents.send(LLM_CHANNELS.MESSAGE_ERROR, event);
          },
        );

        return true;
      } catch (error) {
        console.error("Error in sendMessage handler:", error);

        // Notify the renderer about the error
        const activeWindow = getWindowFromEvent(_event);
        if (!activeWindow) {
          throw new Error("No active window found");
        }

        activeWindow.webContents.send(LLM_CHANNELS.MESSAGE_ERROR, {
          conversationId: params.conversationId,
          messageId: params.messageId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    },
  );

  // Handler for sending a response to a tool call
  ipcMain.handle(
    LLM_CHANNELS.TOOL_CALL_RESPONSE,
    async (_, params: ToolCallUserResponse) => {
      try {
        // Get the main window
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) {
          throw new Error("No window found");
        }

        const vault = await getActiveVault(mainWindow.id);
        if (!vault) {
          throw new Error("No active vault found");
        }

        // 1. get user confirmation result
        // 2. If user defined, respond with a tool message saying the user denied the tool call
        // 3. If the user allowed it, execute the tool from the correct mcp server
        // 4. Send the result back to the frontend in the shape of a tool message
        // 5. The frontend will capture this tool call result and re-spawn the conversation
        // 6. The LLM will see the tool call result and continue the conversation

        const llmService = await getLlmService(vault.path, vault.id);
        const result = await llmService.respondToToolCall(params);

        console.log("respondToToolCall result", result);

        return true;
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
export function removeConversationsIpcHandlers(): void {
  ipcMain.removeHandler(CONVERSATIONS_CHANNELS.GET_CONVERSATIONS);
  ipcMain.removeHandler(CONVERSATIONS_CHANNELS.GET_CONVERSATION);
  ipcMain.removeHandler(CONVERSATIONS_CHANNELS.CREATE_CONVERSATION);
  ipcMain.removeHandler(CONVERSATIONS_CHANNELS.UPDATE_CONVERSATION);
  ipcMain.removeHandler(CONVERSATIONS_CHANNELS.DELETE_CONVERSATION);
  ipcMain.removeHandler(CONVERSATIONS_CHANNELS.ADD_MESSAGE);
  ipcMain.removeHandler(CONVERSATIONS_CHANNELS.CONFIRM_TOOL_CALL);
}
