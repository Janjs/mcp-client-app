import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { CoreMessage } from 'ai';
import { Conversation, ConversationWithPath, ConversationsRegistry } from '../types';

/**
 * Manages conversation operations in the vault.
 * Handles creating, retrieving, updating, and deleting conversations.
 */
export class ConversationsManager {
  private vaultPath: string;
  private conversationsPath: string;
  private registryCache: ConversationsRegistry | null = null;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
    this.conversationsPath = path.join(vaultPath, 'conversations');
  }

  /**
   * Ensures the conversations directory exists in the vault
   */
  private async ensureConversationsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.conversationsPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create conversations directory:', error);
      throw new Error('Failed to create conversations directory');
    }
  }

  /**
   * Generates a filename for a new conversation
   */
  private generateFilename(): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const randomId = randomUUID().slice(0, 8);
    return `${timestamp}-cvs-${randomId}.json`;
  }

  /**
   * Creates a new conversation
   */
  public async createConversation(name: string): Promise<Conversation> {
    await this.ensureConversationsDirectory();
    
    const id = randomUUID();
    const now = new Date().toISOString();
    const filename = this.generateFilename();
    const filePath = path.join(this.conversationsPath, filename);
    
    const conversation: Conversation = {
      id,
      name: name || 'New Conversation',
      createdAt: now,
      updatedAt: now,
      messages: []
    };
    
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf-8');
    
    // Update registry
    await this.addToRegistry(conversation, filePath);
    
    return conversation;
  }
  
  /**
   * Adds a conversation to the registry
   */
  private async addToRegistry(conversation: Conversation, filePath: string): Promise<void> {
    const registry = await this.getConversationsRegistry(true);
    
    registry.conversations[conversation.id] = {
      ...conversation,
      path: filePath
    };
    
    await this.saveConversationsRegistry(registry);
  }

  /**
   * Gets the conversations registry or creates it if it doesn't exist
   */
  private async getConversationsRegistry(forceRefresh = false): Promise<ConversationsRegistry> {
    if (this.registryCache && !forceRefresh) {
      return this.registryCache;
    }

    await this.ensureConversationsDirectory();
    
    const registryPath = path.join(this.conversationsPath, 'registry.json');
    
    try {
      const registryData = await fs.readFile(registryPath, 'utf-8');
      this.registryCache = JSON.parse(registryData);
      return this.registryCache;
    } catch (_error) {
      // If the registry doesn't exist or can't be parsed, create a new one
      const newRegistry: ConversationsRegistry = { conversations: {} };
      await this.saveConversationsRegistry(newRegistry);
      return newRegistry;
    }
  }
  
  /**
   * Saves the conversations registry
   */
  private async saveConversationsRegistry(registry: ConversationsRegistry): Promise<void> {
    const registryPath = path.join(this.conversationsPath, 'registry.json');
    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
    this.registryCache = registry;
  }

  /**
   * Gets all conversations from the registry
   */
  public async getConversations(forceRefresh = false): Promise<ConversationWithPath[]> {
    const registry = await this.getConversationsRegistry(forceRefresh);
    return Object.values(registry.conversations);
  }

  /**
   * Gets a conversation by ID
   */
  public async getConversation(id: string): Promise<Conversation | null> {
    const registry = await this.getConversationsRegistry();
    const conversationWithPath = registry.conversations[id];
    
    if (!conversationWithPath) {
      return null;
    }
    
    try {
      const fileData = await fs.readFile(conversationWithPath.path, 'utf-8');
      return JSON.parse(fileData);
    } catch (error) {
      console.error(`Failed to read conversation ${id}:`, error);
      return null;
    }
  }

  /**
   * Updates a conversation
   */
  public async updateConversation(
    id: string, 
    updates: Partial<Omit<Conversation, 'id'>>
  ): Promise<boolean> {
    const registry = await this.getConversationsRegistry();
    const conversationWithPath = registry.conversations[id];
    
    if (!conversationWithPath) {
      return false;
    }
    
    try {
      const conversation = await this.getConversation(id);
      
      if (!conversation) {
        return false;
      }
      
      const updatedConversation: Conversation = {
        ...conversation,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(
        conversationWithPath.path, 
        JSON.stringify(updatedConversation, null, 2), 
        'utf-8'
      );
      
      // Update registry if name changed
      if (updates.name) {
        registry.conversations[id] = {
          ...registry.conversations[id],
          name: updates.name
        };
        await this.saveConversationsRegistry(registry);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to update conversation ${id}:`, error);
      return false;
    }
  }

  /**
   * Adds a message to a conversation
   */
  public async addMessage(conversationId: string, message: CoreMessage): Promise<boolean> {
    const conversation = await this.getConversation(conversationId);
    
    if (!conversation) {
      return false;
    }
    
    conversation.messages.push(message);
    
    return this.updateConversation(conversationId, { 
      messages: conversation.messages 
    });
  }

  /**
   * Deletes a conversation
   */
  public async deleteConversation(id: string): Promise<boolean> {
    const registry = await this.getConversationsRegistry();
    const conversationWithPath = registry.conversations[id];
    
    if (!conversationWithPath) {
      return false;
    }
    
    try {
      await fs.unlink(conversationWithPath.path);
      
      delete registry.conversations[id];
      await this.saveConversationsRegistry(registry);
      
      return true;
    } catch (error) {
      console.error(`Failed to delete conversation ${id}:`, error);
      return false;
    }
  }
} 