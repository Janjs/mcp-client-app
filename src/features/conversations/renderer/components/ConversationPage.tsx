import React from "react";
import { CoreMessage } from "ai";
import { ChatUI } from "./ChatUI";
import { useConversation } from "../hooks/useConversation";

interface ConversationPageProps {
  vaultPath: string;
  conversationId: string;
}

/**
 * Page for displaying and interacting with a single conversation
 */
export const ConversationPage: React.FC<ConversationPageProps> = ({
  vaultPath,
  conversationId,
}) => {
  const { conversation, isLoading, error, addMessage } = useConversation(
    vaultPath,
    conversationId,
  );

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!conversation) return;

    try {
      // Add user message
      const userMessage: CoreMessage = {
        role: "user",
        content,
      };

      await addMessage(userMessage);

      // TODO: In a real implementation, we would send this message to an LLM
      // and get a response. For now, we'll just simulate a response.

      // Simulate assistant response after a delay
      setTimeout(async () => {
        const assistantMessage: CoreMessage = {
          role: "assistant",
          content: `I received your message: "${content}"\n\nThis is a placeholder response. In a real implementation, this would be a response from an LLM.`,
        };

        await addMessage(assistantMessage);
      }, 1000);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-red-500">
        <p className="text-center">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ChatUI
        conversation={conversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};
