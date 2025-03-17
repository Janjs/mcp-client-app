import React from "react";
import { ChatUI } from "./ChatUI";
import { useMcpChat } from "../hooks/useMcpChat";
interface ConversationPageProps {
  conversationId: string;
}

/**
 * Page for displaying and interacting with a single conversation
 */
export const ConversationPage: React.FC<ConversationPageProps> = ({
  conversationId,
}) => {
  const providerId = "anthropic";
  const modelId = "claude-3-5-sonnet-latest";

  // Initialize LLM chat hook with the conversation ID and provider/model settings
  const {
    conversation,
    isLoadingConversation,
    streamingMessages,
    sendMessage,
    respondToToolCall,
  } = useMcpChat(conversationId, providerId, modelId);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!conversation) return;

    sendMessage({
      role: "user",
      content,
    });
  };

  // Handle tool call response
  const handleToolCallResponse = async (
    conversationId: string,
    toolCallId: string,
    approved: boolean,
    args?: Record<string, unknown>,
  ) => {
    // Handle tool call response
    const result = await respondToToolCall(
      conversationId,
      toolCallId,
      approved,
      args,
    );

    // Add the result to the conversation
    console.log("result", JSON.stringify(result, null, 2));
    if (result?.role === "tool" && result.content?.length > 0) {
      sendMessage(result);
    }
  };

  return (
    <div className="h-full">
      <ChatUI
        conversation={conversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoadingConversation}
        streamingMessages={streamingMessages}
        onRespondToToolCall={handleToolCallResponse}
      />
    </div>
  );
};
