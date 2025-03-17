import { Conversation } from "@features/conversations/types";
import { getConversationFs } from "../services/conversation-fs";
import { invalidateConversationQuery } from "../queries/getConversation";
import { ConfiguredVaultZ } from "@core/validation/schema";

export async function updateConversationMutation(
  vault: ConfiguredVaultZ,
  conversationId: string,
  updates: Partial<Conversation>,
) {
  const fs = getConversationFs(vault.path);
  const registry = await fs.loadConversationsRegistry();
  const conversationWithPath = registry.conversations[conversationId];

  if (!conversationWithPath) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  const conversation = await fs.loadConversation(conversationWithPath.path);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  const updatedConversation = await fs.updateConversation(
    conversationWithPath.path,
    (conversation) => ({
      ...conversation,
      ...updates,
      updatedAt: new Date().toISOString(),
    }),
  );

  invalidateConversationQuery(vault.id, conversationId);

  return updatedConversation;
}
