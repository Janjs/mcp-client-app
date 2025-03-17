import React, { useState } from "react";
import {
  StreamingMessage as StreamingMessageType,
  StreamingMessageChunk,
  ToolCallEvent,
} from "@features/conversations/types";

interface StreamingMessageProps {
  streamingMessages: StreamingMessageType[];
  onRespondToToolCall?: (
    conversationId: string,
    toolCallId: string,
    approved: boolean,
    result?: Record<string, unknown>,
  ) => Promise<void>;
}

/**
 * Component to display messages that are currently streaming from the LLM
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  streamingMessages,
  onRespondToToolCall,
}) => {
  if (streamingMessages.length === 0) {
    return null;
  }

  return (
    <div>
      {streamingMessages.map((message) => (
        <div
          key={message.messageId}
          className="p-4 rounded-lg my-2 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 shadow-sm transition-all duration-300 ease-in-out"
        >
          <div className="flex items-center font-medium text-xs uppercase mb-1 text-gray-500 dark:text-gray-400">
            <span>assistant</span>
            <span className="ml-2 flex items-center text-green-500 dark:text-green-400">
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
              Streaming...
            </span>
          </div>
          <StreamingMessageContent
            message={message}
            onRespondToToolCall={onRespondToToolCall}
          />
        </div>
      ))}
    </div>
  );
};

interface StreamingMessageContentProps {
  message: StreamingMessageType;
  onRespondToToolCall?: (
    conversationId: string,
    toolCallId: string,
    approved: boolean,
    result?: Record<string, unknown>,
  ) => Promise<void>;
}

/**
 * Component to display the content of a streaming message
 */
export const StreamingMessageContent: React.FC<
  StreamingMessageContentProps
> = ({ message, onRespondToToolCall }) => {
  return (
    <div>
      {message.chunks.map((chunk) => (
        <MessageChunk key={chunk.id} chunk={chunk} />
      ))}

      {message.toolCalls?.map((toolCall) => (
        <ToolCallItem
          key={toolCall.responseId}
          toolCall={toolCall}
          onRespondToToolCall={onRespondToToolCall}
        />
      ))}
    </div>
  );
};

interface MessageChunkProps {
  chunk: StreamingMessageChunk;
}

/**
 * Component to display a single chunk of a streaming message
 */
export const MessageChunk: React.FC<MessageChunkProps> = React.memo(
  ({ chunk }) => {
    return <>{chunk.content}</>;
  },
);

interface ToolCallItemProps {
  toolCall: ToolCallEvent;
  onRespondToToolCall?: (
    conversationId: string,
    toolCallId: string,
    approved: boolean,
    result?: Record<string, unknown>,
  ) => Promise<void>;
}

/**
 * Component to display a tool call item with accept/reject functionality
 */
export const ToolCallItem: React.FC<ToolCallItemProps> = ({
  toolCall,
  onRespondToToolCall,
}) => {
  const { toolCall: toolCallData } = toolCall;
  const [responded, setResponded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedArgs, setModifiedArgs] = useState<string>(
    JSON.stringify(toolCallData.args || {}, null, 2),
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (onRespondToToolCall) {
      try {
        setIsProcessing(true);
        // Parse the modified arguments
        const parsedArgs = JSON.parse(modifiedArgs);

        // Send the approval with the modified arguments
        await onRespondToToolCall(
          toolCall.conversationId,
          toolCallData.toolCallId || toolCall.responseId,
          true,
          parsedArgs,
        );

        setResponded(true);
        setError(null);
      } catch (_) {
        setError("Invalid JSON format. Please check your edits.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReject = async () => {
    if (onRespondToToolCall) {
      try {
        setIsProcessing(true);
        await onRespondToToolCall(
          toolCall.conversationId,
          toolCallData.toolCallId || toolCall.responseId,
          false,
        );
        setResponded(true);
      } finally {
        setIsProcessing(false);
      }
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
        Tool: {toolCallData.toolName}
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
          {JSON.stringify(toolCallData.args || {}, null, 2)}
        </pre>
      )}

      {/* Tool call actions */}
      {onRespondToToolCall && !responded && (
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
