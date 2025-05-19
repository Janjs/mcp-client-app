import React, { useEffect, useRef } from "react";
import { CoreMessage } from "ai";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: CoreMessage[];
  onToolCallResponse?: (
    toolCallId: string,
    approved: boolean,
    response: Record<string, unknown>
  ) => void;
  children?: React.ReactNode;
}

/**
 * Renders a list of messages in a conversation
 * Simple implementation without virtualization
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onToolCallResponse,
  children,
}) => {
  // Reference to the messages container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Render a placeholder if there are no messages
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 ">
        <p className="text-center">No messages yet. Start a conversation!</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      {messages.map((message, index) => (
        <MessageItem
          key={`message-${index}`}
          message={message}
          onToolCallResponse={onToolCallResponse}
        />
      ))}
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
};
