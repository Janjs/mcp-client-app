import React from 'react';
import { CoreMessage } from 'ai';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: CoreMessage[];
}

/**
 * Renders a list of messages in a conversation
 */
export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  // Reference to the messages container for auto-scrolling
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Render a placeholder if there are no messages
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500 dark:text-gray-400">
        <p className="text-center">No messages yet. Start a conversation!</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}; 