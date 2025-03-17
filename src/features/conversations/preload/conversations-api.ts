import { ipcRenderer } from "electron";
import { CoreMessage } from "ai";
import {
  Conversation,
  ConversationWithPath,
  CONVERSATIONS_CHANNELS,
  MessageAddedEvent,
} from "../types";

/**
 * API interface for conversation management exposed to the renderer process
 */
export interface ConversationsAPI {
  /**
   * Gets all conversations for a vault
   * @param forceRefresh Whether to bypass cache and force a refresh
   */
  getConversations: (forceRefresh?: boolean) => Promise<ConversationWithPath[]>;

  /**
   * Gets a conversation by ID
   * @param conversationId The ID of the conversation to get
   */
  getConversation: (conversationId: string) => Promise<Conversation | null>;

  /**
   * Creates a new conversation
   * @param name The name of the conversation
   */
  createConversation: (name: string) => Promise<Conversation | null>;

  /**
   * Updates a conversation
   * @param conversationId The ID of the conversation to update
   * @param updates The updates to apply
   */
  updateConversation: (
    conversationId: string,
    updates: Partial<Omit<Conversation, "id">>,
  ) => Promise<boolean>;

  /**
   * Deletes a conversation
   * @param conversationId The ID of the conversation to delete
   */
  deleteConversation: (conversationId: string) => Promise<boolean>;

  /**
   * Adds a message to a conversation
   * @param conversationId The ID of the conversation to add the message to
   * @param message The message to add
   */
  addMessage: (
    conversationId: string,
    message: CoreMessage,
  ) => Promise<boolean>;

  /**
   * Confirms and executes a tool call
   * @param conversationId The ID of the conversation containing the tool call
   * @param toolCallId The ID of the tool call to execute
   * @param args The arguments to pass to the tool
   */
  confirmToolCall: (
    conversationId: string,
    toolCallId: string,
    args: unknown,
  ) => Promise<unknown>;

  /**
   * Registers a listener for message added events
   * @param callback Function to call when a message is added
   */
  onMessageAdded: (callback: (event: MessageAddedEvent) => void) => () => void;
}

/**
 * Implementation of the conversations API for the renderer process
 */
export const conversationsApi: ConversationsAPI = {
  getConversations: (forceRefresh = false) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.GET_CONVERSATIONS,
      forceRefresh,
    );
  },

  getConversation: (conversationId) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.GET_CONVERSATION,
      conversationId,
    );
  },

  createConversation: (name) => {
    return ipcRenderer.invoke(CONVERSATIONS_CHANNELS.CREATE_CONVERSATION, name);
  },

  updateConversation: (conversationId, updates) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.UPDATE_CONVERSATION,
      conversationId,
      updates,
    );
  },

  deleteConversation: (conversationId) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.DELETE_CONVERSATION,
      conversationId,
    );
  },

  addMessage: (conversationId, message) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.ADD_MESSAGE,
      conversationId,
      message,
    );
  },

  confirmToolCall: (conversationId, toolCallId, args) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.CONFIRM_TOOL_CALL,
      conversationId,
      toolCallId,
      args,
    );
  },

  /**
   * Registers a listener for message added events
   * @param callback Function to call when a message is added
   */
  onMessageAdded: (callback) => {
    const listener = (_: unknown, data: MessageAddedEvent) => callback(data);
    ipcRenderer.on(CONVERSATIONS_CHANNELS.MESSAGE_ADDED, listener);
    return () => {
      ipcRenderer.removeListener(
        CONVERSATIONS_CHANNELS.MESSAGE_ADDED,
        listener,
      );
    };
  },
};
