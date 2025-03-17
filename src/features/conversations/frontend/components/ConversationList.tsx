import React from 'react';
import { ConversationWithPath } from '../../types';

interface ConversationListProps {
  conversations: ConversationWithPath[];
  activeConversationId?: string;
  selectedConversationIds?: string[];
  isMultiSelectMode?: boolean;
  onSelectConversation: (conversation: ConversationWithPath) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (conversation: ConversationWithPath) => void;
}

/**
 * Displays a list of conversations with options to select, create, and delete
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  selectedConversationIds = [],
  isMultiSelectMode = false,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation
}) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onCreateConversation}
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>New Conversation</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No conversations yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((conversation) => {
              const isSelected = selectedConversationIds.includes(conversation.id);
              
              return (
                <li key={conversation.id}>
                  <div 
                    className={`
                      p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 
                      ${activeConversationId === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      ${isSelected ? 'bg-blue-100 dark:bg-blue-800/30' : ''}
                    `}
                    onClick={() => onSelectConversation(conversation)}
                  >
                    <div className="flex justify-between items-start">
                      {isMultiSelectMode && (
                        <div className="flex-shrink-0 mr-3">
                          <div className={`w-5 h-5 rounded border ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 flex items-center justify-center' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {conversation.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(conversation.updatedAt)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {conversation.messages.length} messages
                        </p>
                      </div>
                      {!isMultiSelectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation);
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                          aria-label="Delete conversation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}; 