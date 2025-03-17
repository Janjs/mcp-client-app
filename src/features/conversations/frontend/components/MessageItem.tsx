import React, { useState } from "react";
import { CoreMessage } from "ai";

interface MessageItemProps {
  message: CoreMessage & { id?: string };
  isStreaming?: boolean;
  onToolCallResponse?: (
    toolCallId: string,
    response: Record<string, unknown>,
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
  console.log("rendering message", { message });

  // Helper function to render message content based on type
  const renderContent = () => {
    // Handle different roles with appropriate styling
    if (typeof message.content === "string") {
      return (
        <div className="whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current opacity-75 animate-pulse" />
          )}
        </div>
      );
    }

    // Handle array content (multi-part messages)
    if (Array.isArray(message.content)) {
      return (
        <div>
          {message.content.map((part, idx) => {
            // Text part
            if (part.type === "text") {
              return (
                <div key={`text-${idx}`} className="whitespace-pre-wrap">
                  {part.text}
                  {isStreaming && idx === message.content.length - 1 && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current opacity-75 animate-pulse" />
                  )}
                </div>
              );
            }

            // Image part
            if (part.type === "image") {
              return (
                <div key={`image-${idx}`} className="my-2">
                  <img
                    src={
                      part.image instanceof URL
                        ? part.image.toString()
                        : "data:image/png;base64," + part.image
                    }
                    alt="Message attachment"
                    className="max-w-full rounded"
                  />
                </div>
              );
            }

            // Tool call part
            if (part.type === "tool-call") {
              return (
                <ToolCallItem
                  key={`tool-${idx}`}
                  toolName={part.toolName}
                  args={part.args}
                  toolCallId={part.toolCallId}
                  onResponse={onToolCallResponse}
                />
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
      case "system":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500";
      case "user":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "assistant":
        return isStreaming
          ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 border"
          : "bg-green-50 dark:bg-green-900/20";
      case "tool":
        return "bg-purple-50 dark:bg-purple-900/20 text-sm";
      default:
        return "bg-gray-50 dark:bg-gray-800";
    }
  };

  return (
    <div className={`p-4 rounded-lg my-2 ${getMessageStyle()}`}>
      <div className="font-medium text-xs uppercase mb-1 text-gray-500 dark:text-gray-400">
        {message.role}
        {isStreaming && (
          <span className="ml-2 text-green-500 dark:text-green-400">
            Streaming...
          </span>
        )}
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

interface ToolCallItemProps {
  toolName: string;
  args: Record<string, unknown>;
  toolCallId: string;
  onResponse?: (toolCallId: string, response: Record<string, unknown>) => void;
}

/**
 * Component for displaying and interacting with tool calls
 */
const ToolCallItem: React.FC<ToolCallItemProps> = ({
  toolName,
  args,
  toolCallId,
  onResponse,
}) => {
  const [responded, setResponded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedArgs, setModifiedArgs] = useState<string>(
    JSON.stringify(args, null, 2),
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (onResponse) {
      try {
        setIsProcessing(true);
        // Parse the modified arguments
        const parsedArgs = JSON.parse(modifiedArgs);

        // Send the approval with the modified arguments
        onResponse(toolCallId, {
          approved: true,
          result: parsedArgs,
        });

        setResponded(true);
        setError(null);
      } catch (err) {
        setError("Invalid JSON format. Please check your edits.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReject = () => {
    if (onResponse) {
      setIsProcessing(true);
      onResponse(toolCallId, {
        approved: false,
      });
      setResponded(true);
      setIsProcessing(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setError(null);
  };

  return (
    <div className="my-2 p-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <div className="font-semibold flex items-center">
        <svg
          className="w-4 h-4 mr-1 text-purple-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        Tool: {toolName}
      </div>

      {isEditing ? (
        <div className="mt-2">
          <textarea
            className="w-full h-32 p-2 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
            value={modifiedArgs}
            onChange={(e) => setModifiedArgs(e.target.value)}
          />
          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
        </div>
      ) : (
        <pre className="text-xs overflow-auto p-2 bg-gray-200 dark:bg-gray-700 rounded mt-1">
          {JSON.stringify(args, null, 2)}
        </pre>
      )}

      {/* Tool call actions */}
      {onResponse && !responded && (
        <div className="flex mt-2 space-x-2">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            {isEditing ? "Confirm" : "Accept"}
          </button>
          {!isEditing && (
            <button
              onClick={toggleEdit}
              disabled={isProcessing}
              className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              Edit
            </button>
          )}
          {isEditing && (
            <button
              onClick={toggleEdit}
              disabled={isProcessing}
              className="px-3 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Cancel Edit
            </button>
          )}
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            Reject
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
          <svg
            className="w-3 h-3 mr-1 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </div>
      )}

      {responded && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
          Response sent
        </div>
      )}
    </div>
  );
};
