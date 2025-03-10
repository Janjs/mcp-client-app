import React from 'react';
// If react-router-dom is not available, this needs to be added as a dependency
// For now, we'll create a minimal navigation implementation
interface NavigateFunction {
  (to: string): void;
}

const useNavigate = (): NavigateFunction => {
  return (to: string) => {
    console.log(`Navigation to ${to} would happen here`);
    // In a real implementation, this would use the actual router
  };
};

import { CoreMessage } from 'ai';
import { ConversationWithPath } from '../../types';
import { ConversationList } from './ConversationList';
import { useConversations } from '../hooks/useConversations';

interface ConversationsPageProps {
  vaultPath: string;
}

/**
 * Main conversations page that displays the list of conversations
 * When a user selects a conversation, they will be redirected to a dedicated page
 */
export const ConversationsPage: React.FC<ConversationsPageProps> = ({ vaultPath }) => {
  const navigate = useNavigate();
  
  // Use the TanStack Query hook to manage conversations
  const {
    conversations,
    isLoading,
    error,
    createConversation,
    deleteConversation
  } = useConversations(vaultPath);
  
  // Create a new conversation
  const handleCreateConversation = async () => {
    if (!vaultPath) return;
    
    try {
      const name = `New Conversation ${new Date().toLocaleString()}`;
      const newConversation = await createConversation(name);
      
      if (newConversation) {
        // Navigate to the conversation page
        navigate(`/conversation/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };
  
  // Select a conversation
  const handleSelectConversation = (conversation: ConversationWithPath) => {
    // Instead of setting an active conversation, navigate to a dedicated page
    navigate(`/conversation/${conversation.id}`);
  };
  
  // Delete a conversation
  const handleDeleteConversation = async (conversation: ConversationWithPath) => {
    if (!vaultPath) return;
    
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${conversation.name}"?`)) {
      return;
    }
    
    try {
      await deleteConversation(conversation.id);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Conversations</h1>
        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
      </div>
      
      <div className="flex-1 overflow-auto">
        <ConversationList
          conversations={conversations}
          activeConversationId={undefined} // No active conversation on this page
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          onDeleteConversation={handleDeleteConversation}
        />
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <p className="text-gray-900 dark:text-white">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 