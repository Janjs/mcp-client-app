import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConversationWithPath } from '../../types';

/**
 * Hook for managing conversations in a vault using TanStack Query
 */
export const useConversations = (vaultPath: string | null) => {
  const queryClient = useQueryClient();
  
  // Fetch conversations
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conversations', vaultPath || 'none'],
    queryFn: async () => {
      if (!vaultPath) return [];
      return await window.api.conversations.getConversations(vaultPath);
    },
    enabled: !!vaultPath,
  });
  
  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!vaultPath) return null;
      return await window.api.conversations.createConversation(vaultPath, name);
    },
    onSuccess: () => {
      // Invalidate and refetch the conversations query
      if (vaultPath) {
        queryClient.invalidateQueries({ queryKey: ['conversations', vaultPath] });
      }
    },
  });
  
  // Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!vaultPath) return false;
      return await window.api.conversations.deleteConversation(vaultPath, conversationId);
    },
    onSuccess: () => {
      // Invalidate and refetch the conversations query
      if (vaultPath) {
        queryClient.invalidateQueries({ queryKey: ['conversations', vaultPath] });
      }
    },
  });
  
  return {
    conversations,
    isLoading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetchConversations: refetch,
    createConversation: (name: string) => createConversationMutation.mutateAsync(name),
    deleteConversation: (conversationId: string) => deleteConversationMutation.mutateAsync(conversationId),
  };
}; 