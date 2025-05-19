import React from "react";
import { ConversationWithPath } from "../../types";

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
  onDeleteConversation,
}) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <button
          onClick={onCreateConversation}
          className="w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>New Conversation</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center">No conversations yet</div>
        ) : (
          <ul className="divide-y">
            {conversations.map((conversation) => {
              const isSelected = selectedConversationIds.includes(
                conversation.id
              );

              return (
                <li key={conversation.id}>
                  <div
                    className={`
                      p-4 cursor-pointer 
                      ${activeConversationId === conversation.id ? "" : ""}
                      ${isSelected ? "" : ""}
                    `}
                    onClick={() => onSelectConversation(conversation)}
                  >
                    <div className="flex justify-between items-start">
                      {isMultiSelectMode && (
                        <div className="flex-shrink-0 mr-3">
                          <div
                            className={`w-5 h-5 rounded border ${
                              isSelected
                                ? "flex items-center justify-center"
                                : ""
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">
                          {conversation.name}
                        </h3>
                        <p className="text-xs mt-1">
                          {formatDate(conversation.updatedAt)}
                        </p>
                        <p className="text-xs mt-1">
                          {conversation.messages.length} messages
                        </p>
                      </div>
                      {!isMultiSelectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation);
                          }}
                          className="ml-2 p-1 rounded-full"
                          aria-label="Delete conversation"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
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
