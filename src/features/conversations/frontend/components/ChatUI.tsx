import React from "react";
import { Conversation } from "../../types";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { StreamingMessage as StreamingMessageComponent } from "./StreamingMessage";
import { StreamingMessage } from "@features/conversations/types";

interface ChatUIProps {
  conversation: Conversation | null;
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  streamingMessages: StreamingMessage[];
  error?: string | null;
  onRespondToToolCall?: (
    conversationId: string,
    toolCallId: string,
    approved: boolean,
    result?: Record<string, unknown>,
  ) => Promise<void>;
}

/**
 * Main chat interface component that combines message list and input
 */
export const ChatUI: React.FC<ChatUIProps> = ({
  conversation,
  onSendMessage,
  isLoading = false,
  streamingMessages = [],
  error = null,
  onRespondToToolCall,
}) => {
  // Directly use conversation messages from props
  const messages = conversation?.messages || [];

  // Handle sending a new message
  const handleSendMessage = async (content: string) => {
    if (!conversation) return;

    // Send message to backend
    await onSendMessage(content);
  };

  // Handle tool call response by adapting it to our expected format
  const handleToolCallResponse = async (
    toolCallId: string,
    approved: boolean,
    args: Record<string, unknown>,
  ) => {
    if (!conversation || !onRespondToToolCall) return;

    try {
      // Call the IPC handler to respond to the tool call
      await onRespondToToolCall(conversation.id, toolCallId, approved, args);
    } catch (error) {
      console.error("Failed to respond to tool call:", error);
    }
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <p className="text-center">
          Select a conversation or create a new one to start chatting.
        </p>
      </div>
    );
  }

  const isStreaming = streamingMessages.length > 0;

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

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            onToolCallResponse={handleToolCallResponse}
          >
            {isStreaming && streamingMessages.length > 0 && (
              <StreamingMessageComponent
                streamingMessages={streamingMessages}
                onRespondToToolCall={onRespondToToolCall}
              />
            )}
          </MessageList>

          {/* Show streaming messages if any */}

          {/* Show error if any */}
          {error && (
            <div className="p-4 mx-4 my-2 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading || isStreaming}
        placeholder={
          isLoading
            ? "Waiting for response..."
            : isStreaming
              ? "AI is responding..."
              : "Type a message..."
        }
      />
    </div>
  );
};
