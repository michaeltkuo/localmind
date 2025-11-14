// Storage service for managing conversations locally
import type { Conversation } from '../types';

const STORAGE_KEY = 'local-chatbot-conversations';

export class StorageService {
  /**
   * Save a conversation to local storage
   */
  static saveConversation(conversation: Conversation): void {
    try {
      const conversations = this.loadAllConversations();
      const index = conversations.findIndex(c => c.id === conversation.id);
      
      if (index >= 0) {
        conversations[index] = conversation;
      } else {
        conversations.push(conversation);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  /**
   * Load all conversations from local storage
   */
  static loadAllConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as Conversation[];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  /**
   * Load a single conversation by ID
   */
  static loadConversation(id: string): Conversation | null {
    const conversations = this.loadAllConversations();
    return conversations.find(c => c.id === id) || null;
  }

  /**
   * Delete a conversation
   */
  static deleteConversation(id: string): void {
    try {
      const conversations = this.loadAllConversations();
      const filtered = conversations.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  /**
   * Clear all conversations
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing conversations:', error);
    }
  }
}
