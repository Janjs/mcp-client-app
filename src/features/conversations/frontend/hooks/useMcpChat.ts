import {
  Conversation,
  MessageAddedEvent,
  MessageCompletionEvent,
  MessageStreamEvent,
  StreamingMessage,
  ToolCallEvent,
} from "@features/conversations/types";
import { CoreMessage, CoreUserMessage } from "ai";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

export interface McpChatReturn {
  sendMessage: (message: string) => Promise<void>;
  conversation: Conversation | null;
  isLoadingConversation: boolean;
  streamingMessages: StreamingMessage[];
  respondToToolCall: (
    messageId: string,
    toolCallId: string,
    allowed: boolean,
  ) => Promise<void>;
}

/**
 * Query key for the conversation
 */
export const conversationQueryKey = (conversationId: string | null) => [
  "conversation",
  conversationId || "none",
];

export function useMcpChat(
  conversationId: string,
  providerId: string,
  modelId: string,
) {
  const queryClient = useQueryClient();

  const [streamingMessages, setStreamingMessages] = useState<
    StreamingMessage[]
  >([]);

  // Fetch conversation

  const { data: conversation, isLoading: isLoadingConversation } =
    useQuery<Conversation | null>({
      queryKey: conversationQueryKey(conversationId),
      queryFn: () => window.api.conversations.getConversation(conversationId),
      initialData: null,
    });

  // Send message
  const sendMessage = async (message: CoreMessage) => {
    const messageId = uuidv4();
    const responseId = uuidv4();
    await window.api.llm.sendMessage({
      conversationId,
      providerName: providerId,
      modelName: modelId,
      message,
      messageId,
      responseId,
    });
  };

  const respondToToolCall = async (
    conversationId: string,
    toolCallId: string,
    approved: boolean,
    args?: Record<string, unknown>,
  ) => {
    console.log("respondToToolCall", {
      conversationId,
      toolCallId,
      approved,
      args,
    });
    return await window.api.llm.respondToToolCall({
      conversationId,
      toolCallId,
      approved,
      args,
    });
  };

  // Message stream listener
  useEffect(() => {
    if (!conversationId) return;

    const messageStreamUnsubscribe = window.api.llm.onMessageStream(
      (event: MessageStreamEvent) => {
        if (event.conversationId !== conversationId) return;

        setStreamingMessages((prev) => {
          const existingResponse = prev.find(
            (m) => m.messageId === event.responseId,
          );

          if (!existingResponse) {
            return [
              ...prev,
              { messageId: event.responseId, chunks: [event.chunk] },
            ];
          }

          return prev.map((m) => {
            if (m.messageId === event.responseId) {
              return {
                ...m,
                chunks: [...m.chunks, event.chunk],
              };
            }
            return m;
          });
        });

        console.log("message stream event", { event });
      },
    );

    return () => {
      messageStreamUnsubscribe();
    };
  }, [conversationId]);

  // listen to message added event and refetch conversation

  useEffect(() => {
    if (!conversationId) return;

    const messageAddedUnsubscribe = window.api.conversations.onMessageAdded(
      (event: MessageAddedEvent) => {
        if (event.conversationId !== conversationId) return;

        console.log("message added event", { event });

        queryClient.invalidateQueries({
          queryKey: conversationQueryKey(conversationId),
        });
      },
    );

    return () => {
      messageAddedUnsubscribe();
    };
  }, [conversationId]);

  // Listen to message completion event
  // remove the message from the streaming messages
  // for now let's wait, I think the IPC will handle refetching the conversation, since it will invalidate the query
  useEffect(() => {
    if (!conversationId) return;

    const messageCompletionUnsubscribe = window.api.llm.onMessageCompletion(
      (event: MessageCompletionEvent) => {
        if (event.conversationId !== conversationId) return;

        setStreamingMessages((prev) =>
          prev.filter((m) => m.messageId !== event.responseId),
        );

        console.log("message completion event", { event });
      },
    );

    return () => {
      messageCompletionUnsubscribe();
    };
  }, [conversationId]);

  // listen to tool call event
  // modify the streaming messages to include the tool call
  useEffect(() => {
    if (!conversationId) return;

    const toolCallUnsubscribe = window.api.llm.onToolCall(
      (event: ToolCallEvent) => {
        if (event.conversationId !== conversationId) return;

        console.log("tool call event", { event });

        setStreamingMessages((prev) => {
          return prev.map((m) => {
            if (m.messageId === event.responseId) {
              const currentToolCalls = m.toolCalls || [];
              return {
                ...m,
                toolCalls: [...currentToolCalls, event],
              };
            }
            return m;
          });
        });
      },
    );

    return () => {
      toolCallUnsubscribe();
    };
  }, [conversationId]);

  return {
    conversation,
    isLoadingConversation,
    streamingMessages,
    sendMessage,
    respondToToolCall,
  };
}
