import { queryOptions } from "@tanstack/react-query";
import { getConversationFs } from "../services/conversation-fs";
import { appQueryClient } from "@core/queries/client";

export const getConversationsQueryKey = (vaultPath: string) => [
  "conversations",
  vaultPath,
];

export const getConversationsQueryOptions = (vaultPath: string) =>
  queryOptions({
    queryKey: getConversationsQueryKey(vaultPath),
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const fs = getConversationFs(vaultPath);
      const registry = await fs.loadConversationsRegistry();
      return Object.values(registry.conversations).sort((a, b) => {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    },
  });

export const invalidateConversationsQuery = (vaultPath: string) =>
  appQueryClient.invalidateQueries({
    queryKey: getConversationsQueryKey(vaultPath),
  });

export const getConversationsQuery = (vaultPath: string) =>
  appQueryClient.fetchQuery(getConversationsQueryOptions(vaultPath));
