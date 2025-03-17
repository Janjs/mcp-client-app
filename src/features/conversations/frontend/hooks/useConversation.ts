import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CoreMessage } from "ai";
import { Conversation } from "../../types";

export const conversationQueryKey = (conversationId: string | null) => [
  "conversation",
  conversationId || "none",
];

/**
 * Hook for managing a single conversation using TanStack Query
 */
export const useConversation = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  // Generate a stable query key for this conversation

  // Fetch conversation
  const {
    data: conversation = null,
    isLoading,
    error,
    refetch,
  } = useQuery<Conversation | null>({
    queryKey: conversationQueryKey(conversationId),
    queryFn: async () => {
      if (!conversationId) return null;
      return await window.api.conversations.getConversation(conversationId);
    },
    enabled: !!conversationId,
  });

  // Update conversation
  const updateConversationMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<Conversation, "id">>) => {
      if (!conversationId) return false;
      return await window.api.conversations.updateConversation(
        conversationId,
        updates,
      );
    },
    onSuccess: () => {
      // Invalidate and refetch the conversation query
      queryClient.invalidateQueries({
        queryKey: conversationQueryKey(conversationId),
      });

      // Also invalidate the conversations list as the updated conversation might appear there
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });

  // Add a message to the conversation
  const addMessageMutation = useMutation({
    mutationFn: async (message: CoreMessage) => {
      if (!conversationId) return false;
      return await window.api.conversations.addMessage(conversationId, message);
    },
    onSuccess: () => {
      // Invalidate and refetch the conversation query
      queryClient.invalidateQueries({
        queryKey: conversationQueryKey(conversationId),
      });

      // Also invalidate the conversations list as the message might update the conversation preview
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });

  return {
    conversation,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetchConversation: refetch,
    updateConversation: (updates: Partial<Omit<Conversation, "id">>) =>
      updateConversationMutation.mutateAsync(updates),
    addMessage: (message: CoreMessage) =>
      addMessageMutation.mutateAsync(message),
  };
};
