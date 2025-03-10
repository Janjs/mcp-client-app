import React from 'react';
import { CoreMessage } from 'ai';

interface MessageItemProps {
  message: CoreMessage;
}

/**
 * Renders a single message in a conversation
 */
export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  // Helper function to render message content based on type
  const renderContent = () => {
    // Handle different roles with appropriate styling
    if (typeof message.content === 'string') {
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    }
    
    // Handle array content (multi-part messages)
    if (Array.isArray(message.content)) {
      return (
        <div>
          {message.content.map((part, idx) => {
            // Text part
            if (part.type === 'text') {
              return (
                <div key={idx} className="whitespace-pre-wrap">
                  {part.text}
                </div>
              );
            }
            
            // Image part
            if (part.type === 'image') {
              return (
                <div key={idx} className="my-2">
                  <img 
                    src={part.image instanceof URL ? part.image.toString() : 'data:image/png;base64,' + part.image} 
                    alt="Message attachment" 
                    className="max-w-full rounded"
                  />
                </div>
              );
            }
            
            // Tool call part
            if (part.type === 'tool-call') {
              return (
                <div key={idx} className="my-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <div className="font-semibold">Tool: {part.toolName}</div>
                  <pre className="text-xs overflow-auto p-2 bg-gray-200 dark:bg-gray-700 rounded mt-1">
                    {JSON.stringify(part.args, null, 2)}
                  </pre>
                </div>
              );
            }
            
            return null;
          })}
        </div>
      );
    }
    
    // Fallback for unknown content type
    return <div>Unsupported message format</div>;
  };
  
  // Determine message style based on role
  const getMessageStyle = () => {
    switch (message.role) {
      case 'system':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
      case 'user':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'assistant':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'tool':
        return 'bg-purple-50 dark:bg-purple-900/20 text-sm';
      default:
        return 'bg-gray-50 dark:bg-gray-800';
    }
  };
  
  return (
    <div className={`p-4 rounded-lg my-2 ${getMessageStyle()}`}>
      <div className="font-medium text-xs uppercase mb-1 text-gray-500 dark:text-gray-400">
        {message.role}
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
}; 