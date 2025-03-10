import React from 'react';
import { CoreMessage } from 'ai';
import { Conversation } from '../../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatUIProps {
  conversation: Conversation | null;
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Main chat interface component that combines message list and input
 */
export const ChatUI: React.FC<ChatUIProps> = ({
  conversation,
  onSendMessage,
  isLoading = false
}) => {
  // Directly use conversation messages from props
  const messages = conversation?.messages || [];
  
  // Handle sending a new message
  const handleSendMessage = async (content: string) => {
    if (!conversation) return;
    
    // Send message to backend
    await onSendMessage(content);
  };
  
  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <p className="text-center">Select a conversation or create a new one to start chatting.</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {conversation.name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(conversation.createdAt).toLocaleString()}
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      
      <MessageInput 
        onSendMessage={handleSendMessage} 
        disabled={isLoading}
        placeholder={isLoading ? 'Waiting for response...' : 'Type a message...'}
      />
    </div>
  );
}; 