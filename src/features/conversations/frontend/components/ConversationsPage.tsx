import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ConversationWithPath } from "../../types";
import { ConversationList } from "./ConversationList";
import { useConversations } from "../hooks/useConversations";

interface ConversationsPageProps {}

/**
 * Main conversations page that displays the list of conversations
 * When a user selects a conversation, they will be redirected to a dedicated page
 */
export const ConversationsPage: React.FC<ConversationsPageProps> = () => {
  const navigate = useNavigate();
  // Add state for multi-select mode and selected conversations
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<string[]>(
    [],
  );

  // Use the TanStack Query hook to manage conversations
  const {
    conversations,
    isLoading,
    error,
    createConversation,
    deleteConversation,
  } = useConversations();

  // Create a new conversation
  const handleCreateConversation = async () => {
    try {
      const name = `New Conversation ${new Date().toLocaleString()}`;
      const newConversation = await createConversation(name);

      if (newConversation) {
        // Navigate to the conversation page
        navigate({
          to: "/app/conversations/$conversationId",
          params: { conversationId: newConversation.id },
        });
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  // Select a conversation
  const handleSelectConversation = (conversation: ConversationWithPath) => {
    // If in multi-select mode, toggle selection instead of navigating
    if (isMultiSelectMode) {
      handleToggleConversationSelection(conversation.id);
      return;
    }

    // Otherwise, navigate to the conversation page
    navigate({
      to: "/app/conversations/$conversationId",
      params: { conversationId: conversation.id },
    });
  };

  // Toggle selection of a conversation in multi-select mode
  const handleToggleConversationSelection = (conversationId: string) => {
    setSelectedConversations((prev) => {
      if (prev.includes(conversationId)) {
        return prev.filter((id) => id !== conversationId);
      } else {
        return [...prev, conversationId];
      }
    });
  };

  // Toggle multi-select mode
  const handleToggleMultiSelectMode = () => {
    setIsMultiSelectMode((prev) => !prev);
    // Clear selections when exiting multi-select mode
    if (isMultiSelectMode) {
      setSelectedConversations([]);
    }
  };

  // Select all conversations
  const handleSelectAllConversations = () => {
    if (selectedConversations.length === conversations.length) {
      // If all are selected, deselect all
      setSelectedConversations([]);
    } else {
      // Otherwise, select all
      setSelectedConversations(conversations.map((conv) => conv.id));
    }
  };

  // Delete a single conversation
  const handleDeleteConversation = async (
    conversation: ConversationWithPath,
  ) => {
    // Confirm deletion
    if (
      !window.confirm(`Are you sure you want to delete "${conversation.name}"?`)
    ) {
      return;
    }

    try {
      await deleteConversation(conversation.id);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  // Delete multiple selected conversations
  const handleDeleteSelectedConversations = async () => {
    if (selectedConversations.length === 0) return;

    // Confirm deletion
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedConversations.length} conversations?`,
      )
    ) {
      return;
    }

    try {
      // Delete each selected conversation one by one
      for (const conversationId of selectedConversations) {
        await deleteConversation(conversationId);
      }
      // Clear selections after deletion
      setSelectedConversations([]);
    } catch (error) {
      console.error("Failed to delete conversations:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Conversations
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleToggleMultiSelectMode}
              className={`px-3 py-1 rounded-lg text-sm ${
                isMultiSelectMode
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              {isMultiSelectMode ? "Cancel" : "Select"}
            </button>

            {isMultiSelectMode && (
              <>
                <button
                  onClick={handleSelectAllConversations}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-200"
                >
                  {selectedConversations.length === conversations.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={handleDeleteSelectedConversations}
                  disabled={selectedConversations.length === 0}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedConversations.length > 0
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                  }`}
                >
                  Delete ({selectedConversations.length})
                </button>
              </>
            )}
          </div>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="flex-1 overflow-auto">
        <ConversationList
          conversations={conversations}
          activeConversationId={undefined} // No active conversation on this page
          selectedConversationIds={
            isMultiSelectMode ? selectedConversations : []
          }
          isMultiSelectMode={isMultiSelectMode}
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
