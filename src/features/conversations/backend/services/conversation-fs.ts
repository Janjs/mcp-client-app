import path from "path";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  Conversation,
  ConversationsRegistry,
} from "@features/conversations/types";
import {
  readJsonFile,
  writeJsonFile,
  updateJsonFile,
} from "@core/utils/json-file-utils";

// Define schemas for data validation
export const ConversationSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(z.any()),
});

export const ConversationWithPathSchema = ConversationSchema.extend({
  path: z.string(),
});

export const ConversationsRegistrySchema = z.object({
  conversations: z.record(z.string(), ConversationWithPathSchema),
});

/**
 * Handles file system operations for conversations
 */
export class ConversationFs {
  conversationsPath: string;

  constructor(vaultPath: string) {
    this.conversationsPath = path.join(vaultPath, "conversations");
  }

  /**
   * Gets the path to the registry file
   */
  private getRegistryPath(): string {
    return path.join(this.conversationsPath, "registry.json");
  }

  /**
   * Generates a filename for a new conversation
   */
  generateFilename(): string {
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const randomId = randomUUID().slice(0, 8);
    return `${timestamp}-cvs-${randomId}.json`;
  }

  /**
   * Gets the full path for a conversation file
   */
  getConversationPath(filename: string): string {
    return path.join(this.conversationsPath, filename);
  }

  /**
   * Loads the conversations registry from disk
   */
  async loadConversationsRegistry(): Promise<ConversationsRegistry> {
    const registryPath = this.getRegistryPath();
    const defaultRegistry: ConversationsRegistry = { conversations: {} };

    return await readJsonFile(
      registryPath,
      ConversationsRegistrySchema,
      defaultRegistry,
    );
  }

  /**
   * Saves the conversations registry
   */
  async saveConversationsRegistry(
    registry: ConversationsRegistry,
  ): Promise<void> {
    const registryPath = this.getRegistryPath();
    await writeJsonFile(registryPath, registry, ConversationsRegistrySchema);
  }

  /**
   * Updates the conversations registry
   */
  async updateConversationsRegistry(
    updateFn: (registry: ConversationsRegistry) => ConversationsRegistry,
  ): Promise<ConversationsRegistry> {
    const registryPath = this.getRegistryPath();
    const defaultRegistry: ConversationsRegistry = { conversations: {} };

    return await updateJsonFile(
      registryPath,
      updateFn,
      ConversationsRegistrySchema,
      defaultRegistry,
    );
  }

  /**
   * Loads a conversation from disk
   */
  async loadConversation(
    conversationPath: string,
  ): Promise<Conversation | null> {
    try {
      return await readJsonFile(conversationPath, ConversationSchema);
    } catch (error) {
      console.error(
        `Failed to read conversation at ${conversationPath}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Saves a conversation to disk
   */
  async saveConversation(
    conversationPath: string,
    conversation: Conversation,
  ): Promise<boolean> {
    try {
      await writeJsonFile(conversationPath, conversation, ConversationSchema);
      return true;
    } catch (error) {
      console.error(
        `Failed to write conversation to ${conversationPath}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Updates a conversation file
   */
  async updateConversation(
    conversationPath: string,
    updateFn: (conversation: Conversation) => Conversation,
  ): Promise<Conversation | null> {
    try {
      const conversation = await this.loadConversation(conversationPath);
      if (!conversation) return null;

      const updatedConversation = updateFn(conversation);
      await this.saveConversation(conversationPath, updatedConversation);
      return updatedConversation;
    } catch (error) {
      console.error(
        `Failed to update conversation at ${conversationPath}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Deletes a conversation file
   */
  async deleteConversation(conversationPath: string): Promise<boolean> {
    const fs = require("fs/promises");
    try {
      await fs.unlink(conversationPath);
      return true;
    } catch (error) {
      console.error(
        `Failed to delete conversation file at ${conversationPath}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Adds a conversation to the registry
   */
  async addConversationToRegistry(
    conversation: Conversation,
    filePath: string,
  ): Promise<void> {
    await this.updateConversationsRegistry((registry) => {
      registry.conversations[conversation.id] = {
        ...conversation,
        path: filePath,
      };
      return registry;
    });
  }

  /**
   * Removes a conversation from the registry
   */
  async removeConversationFromRegistry(
    conversationId: string,
  ): Promise<boolean> {
    const updatedRegistry = await this.updateConversationsRegistry(
      (registry) => {
        if (registry.conversations[conversationId]) {
          delete registry.conversations[conversationId];
        }
        return registry;
      },
    );

    return !updatedRegistry.conversations[conversationId];
  }
}

// Singleton pattern for ConversationFs
const conversationFsInstances: Record<string, ConversationFs> = {};

export function getConversationFs(vaultPath: string): ConversationFs {
  if (!conversationFsInstances[vaultPath]) {
    conversationFsInstances[vaultPath] = new ConversationFs(vaultPath);
  }
  return conversationFsInstances[vaultPath];
}
