/**
 * Types for the conversations feature.
 * This file defines the structure for conversations and related entities.
 */

import { CoreMessage } from 'ai';

/**
 * Represents a conversation with an AI model.
 * Conversations are stored as JSON files in the vault.
 */
export interface Conversation {
  /** Unique identifier for the conversation */
  id: string;
  
  /** User-friendly name for the conversation */
  name: string;
  
  /** ISO timestamp when the conversation was created */
  createdAt: string;
  
  /** ISO timestamp when the conversation was last updated */
  updatedAt: string;
  
  /** Array of messages in the conversation */
  messages: CoreMessage[];
}

/**
 * Conversation with file path information
 */
export interface ConversationWithPath extends Conversation {
  /** Path to the conversation file */
  path: string;
}

/**
 * Registry of all conversations in a vault
 */
export interface ConversationsRegistry {
  conversations: Record<string, ConversationWithPath>;
}

/**
 * Channel names for IPC communication
 */
export const CONVERSATIONS_CHANNELS = {
  GET_CONVERSATIONS: "conversations:getConversations",
  GET_CONVERSATION: "conversations:getConversation",
  CREATE_CONVERSATION: "conversations:createConversation",
  UPDATE_CONVERSATION: "conversations:updateConversation",
  DELETE_CONVERSATION: "conversations:deleteConversation",
  ADD_MESSAGE: "conversations:addMessage",
}; 