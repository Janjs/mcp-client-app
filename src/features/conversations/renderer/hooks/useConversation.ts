import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CoreMessage } from "ai";
import { Conversation } from "../../types";

/**
 * Hook for managing a single conversation using TanStack Query
 */
export const useConversation = (
  vaultPath: string | null,
  conversationId: string | null,
) => {
  const queryClient = useQueryClient();

  // Generate a stable query key for this conversation
  const conversationQueryKey = [
    "conversation",
    vaultPath || "none",
    conversationId || "none",
  ];

  // Fetch conversation
  const {
    data: conversation = null,
    isLoading,
    error,
    refetch,
  } = useQuery<Conversation | null>({
    queryKey: conversationQueryKey,
    queryFn: async () => {
      if (!vaultPath || !conversationId) return null;
      return await window.api.conversations.getConversation(
        vaultPath,
        conversationId,
      );
    },
    enabled: !!vaultPath && !!conversationId,
  });

  // Update conversation
  const updateConversationMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<Conversation, "id">>) => {
      if (!vaultPath || !conversationId) return false;
      return await window.api.conversations.updateConversation(
        vaultPath,
        conversationId,
        updates,
      );
    },
    onSuccess: () => {
      // Invalidate and refetch the conversation query
      queryClient.invalidateQueries({ queryKey: conversationQueryKey });

      // Also invalidate the conversations list as the updated conversation might appear there
      if (vaultPath) {
        queryClient.invalidateQueries({
          queryKey: ["conversations", vaultPath],
        });
      }
    },
  });

  // Add a message to the conversation
  const addMessageMutation = useMutation({
    mutationFn: async (message: CoreMessage) => {
      if (!vaultPath || !conversationId) return false;
      return await window.api.conversations.addMessage(
        vaultPath,
        conversationId,
        message,
      );
    },
    onSuccess: () => {
      // Invalidate and refetch the conversation query
      queryClient.invalidateQueries({ queryKey: conversationQueryKey });

      // Also invalidate the conversations list as the message might update the conversation preview
      if (vaultPath) {
        queryClient.invalidateQueries({
          queryKey: ["conversations", vaultPath],
        });
      }
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
