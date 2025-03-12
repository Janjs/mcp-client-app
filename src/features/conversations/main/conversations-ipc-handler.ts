import { ipcMain } from "electron";
import { ConversationsManager } from "./conversations-manager";
import { CONVERSATIONS_CHANNELS, Conversation } from "../types";
import { CoreMessage } from "ai";
import { getActiveVault } from "@features/vault/main/utils";
import { getWindowIdFromEvent } from "@core/utils/ipc";

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

/**
 * Sets up IPC handlers for conversation operations
 */
export function setupConversationsIpcHandlers(): void {
  // Get all conversations
  ipcMain.handle(
    CONVERSATIONS_CHANNELS.GET_CONVERSATIONS,
    async (_event, forceRefresh: boolean = false) => {
      try {
        const windowId = getWindowIdFromEvent(_event);
        if (!windowId) {
          throw new Error("No active window found");
        }
        const vault = await getActiveVault(windowId);
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
    async (_event, conversationId: string) => {
      try {
        const windowId = getWindowIdFromEvent(_event);
        if (!windowId) {
          throw new Error("No active window found");
        }
        const vault = await getActiveVault(windowId);
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
    async (_event, name: string) => {
      try {
        const windowId = getWindowIdFromEvent(_event);
        if (!windowId) {
          throw new Error("No active window found");
        }
        const vault = await getActiveVault(windowId);
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
    async (_event, conversationId: string, updates: Partial<Conversation>) => {
      try {
        const windowId = getWindowIdFromEvent(_event);
        if (!windowId) {
          throw new Error("No active window found");
        }
        const vault = await getActiveVault(windowId);
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
    async (_event, conversationId: string) => {
      try {
        const windowId = getWindowIdFromEvent(_event);
        if (!windowId) {
          throw new Error("No active window found");
        }
        const vault = await getActiveVault(windowId);
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
    async (_event, conversationId: string, message: CoreMessage) => {
      try {
        const windowId = getWindowIdFromEvent(_event);
        if (!windowId) {
          throw new Error("No active window found");
        }
        const vault = await getActiveVault(windowId);
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
}
