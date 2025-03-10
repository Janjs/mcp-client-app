import { ipcRenderer } from 'electron';
import { CoreMessage } from 'ai';
import { Conversation, ConversationWithPath, CONVERSATIONS_CHANNELS } from '../types';

/**
 * API interface for conversation management exposed to the renderer process
 */
export interface ConversationsAPI {
  /**
   * Gets all conversations for a vault
   * @param vaultPath The path to the vault
   * @param forceRefresh Whether to bypass cache and force a refresh
   */
  getConversations: (
    vaultPath: string,
    forceRefresh?: boolean
  ) => Promise<ConversationWithPath[]>;

  /**
   * Gets a conversation by ID
   * @param vaultPath The path to the vault
   * @param conversationId The ID of the conversation to get
   */
  getConversation: (
    vaultPath: string,
    conversationId: string
  ) => Promise<Conversation | null>;

  /**
   * Creates a new conversation
   * @param vaultPath The path to the vault
   * @param name The name of the conversation
   */
  createConversation: (
    vaultPath: string,
    name: string
  ) => Promise<Conversation | null>;

  /**
   * Updates a conversation
   * @param vaultPath The path to the vault
   * @param conversationId The ID of the conversation to update
   * @param updates The updates to apply
   */
  updateConversation: (
    vaultPath: string,
    conversationId: string,
    updates: Partial<Omit<Conversation, 'id'>>
  ) => Promise<boolean>;

  /**
   * Deletes a conversation
   * @param vaultPath The path to the vault
   * @param conversationId The ID of the conversation to delete
   */
  deleteConversation: (
    vaultPath: string,
    conversationId: string
  ) => Promise<boolean>;

  /**
   * Adds a message to a conversation
   * @param vaultPath The path to the vault
   * @param conversationId The ID of the conversation to add the message to
   * @param message The message to add
   */
  addMessage: (
    vaultPath: string,
    conversationId: string,
    message: CoreMessage
  ) => Promise<boolean>;
}

/**
 * Implementation of the conversations API for the renderer process
 */
export const conversationsApi: ConversationsAPI = {
  getConversations: (vaultPath, forceRefresh = false) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.GET_CONVERSATIONS,
      vaultPath,
      forceRefresh
    );
  },

  getConversation: (vaultPath, conversationId) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.GET_CONVERSATION,
      vaultPath,
      conversationId
    );
  },

  createConversation: (vaultPath, name) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.CREATE_CONVERSATION,
      vaultPath,
      name
    );
  },

  updateConversation: (vaultPath, conversationId, updates) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.UPDATE_CONVERSATION,
      vaultPath,
      conversationId,
      updates
    );
  },

  deleteConversation: (vaultPath, conversationId) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.DELETE_CONVERSATION,
      vaultPath,
      conversationId
    );
  },

  addMessage: (vaultPath, conversationId, message) => {
    return ipcRenderer.invoke(
      CONVERSATIONS_CHANNELS.ADD_MESSAGE,
      vaultPath,
      conversationId,
      message
    );
  },
}; 