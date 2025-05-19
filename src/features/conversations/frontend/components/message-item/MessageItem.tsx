import React from "react";
import { CoreMessage } from "ai";
import { getMessageStyle } from "./styles";
import { TextPart } from "./parts/TextPart";
import { ImagePart } from "./parts/ImagePart";
import { ToolCallPart } from "./parts/ToolCallPart";
import { ToolResultPart } from "./parts/ToolResultPart";

export interface MessageItemProps {
  message: CoreMessage & { id?: string };
  isStreaming?: boolean;
  onToolCallResponse?: (
    toolCallId: string,
    approved: boolean,
    args: Record<string, unknown>
  ) => void;
}

/**
 * Renders a single message in a conversation
 */
export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming = false,
  onToolCallResponse,
}) => {
  // Render content based on message type
  const renderContent = () => {
    // Handle string content type
    if (typeof message.content === "string") {
      return <TextPart text={message.content} isStreaming={isStreaming} />;
    }

    // Handle array content type (multi-part messages)
    if (Array.isArray(message.content)) {
      return (
        <>
          {message.content.map((part, idx) => {
            const isLastPart = idx === message.content.length - 1;

            switch (part.type) {
              case "text":
                return (
                  <TextPart
                    key={`text-${idx}`}
                    text={part.text}
                    isStreaming={isStreaming && isLastPart}
                  />
                );

              case "image":
                return <ImagePart key={`image-${idx}`} image={part.image} />;

              case "tool-call":
                return (
                  <ToolCallPart
                    key={`tool-${idx}`}
                    toolName={part.toolName}
                    args={part.args}
                    toolCallId={part.toolCallId}
                    onResponse={onToolCallResponse}
                  />
                );

              case "tool-result":
                return (
                  <ToolResultPart
                    key={`tool-result-${idx}`}
                    result={part.result}
                  />
                );

              default:
                return null;
            }
          })}
        </>
      );
    }

    // Fallback for unknown content type
    return <div>Unsupported message format</div>;
  };

  return (
    <div
      className={`p-4 rounded-lg my-2 ${getMessageStyle(
        message.role,
        isStreaming
      )}`}
    >
      <div className="font-medium text-xs uppercase mb-1">
        {message.role}
        {isStreaming && <span className="ml-2">Streaming...</span>}
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};
