import { queryOptions } from "@tanstack/react-query";
import { getConversationFs } from "../services/conversation-fs";
import { appQueryClient } from "@core/queries/client";
import { ConfiguredVaultZ } from "@core/validation/schema";

export const getConversationQueryKey = (
  vaultId: string,
  conversationId: string,
) => ["conversation", vaultId, conversationId];

export const getConversationQueryOptions = (
  vault: ConfiguredVaultZ,
  conversationId: string,
) =>
  queryOptions({
    queryKey: getConversationQueryKey(vault.id, conversationId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const conversationFs = getConversationFs(vault.path);
      const registry = await conversationFs.loadConversationsRegistry();
      const conversationWithPath = registry.conversations[conversationId];
      if (!conversationWithPath) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      return conversationFs.loadConversation(conversationWithPath.path);
    },
  });

export const invalidateConversationQuery = (
  vaultId: string,
  conversationId: string,
) =>
  appQueryClient.invalidateQueries({
    queryKey: getConversationQueryKey(vaultId, conversationId),
  });

export const getConversationQuery = (
  vault: ConfiguredVaultZ,
  conversationId: string,
) =>
  appQueryClient.fetchQuery(getConversationQueryOptions(vault, conversationId));
