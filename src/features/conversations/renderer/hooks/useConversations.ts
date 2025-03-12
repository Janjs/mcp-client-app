import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationWithPath } from "../../types";

/**
 * Hook for managing conversations in a vault using TanStack Query
 */
export const useConversations = () => {
  const queryClient = useQueryClient();

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      return await window.api.conversations.getConversations();
    },
  });

  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (name: string) => {
      return await window.api.conversations.createConversation(name);
    },
    onSuccess: () => {
      // Invalidate and refetch the conversations query
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });

  // Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await window.api.conversations.deleteConversation(conversationId);
    },
    onSuccess: () => {
      // Invalidate and refetch the conversations query
      queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });

  return {
    conversations,
    isLoading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetchConversations: refetch,
    createConversation: (name: string) =>
      createConversationMutation.mutateAsync(name),
    deleteConversation: (conversationId: string) =>
      deleteConversationMutation.mutateAsync(conversationId),
  };
};
