import { ConfiguredVaultZ } from "@core/validation/schema";
import { getConversationFs } from "../services/conversation-fs";
import { invalidateConversationsQuery } from "../queries/getConversations";
import { invalidateConversationQuery } from "../queries/getConversation";

export async function deleteConversationMutation(
  vault: ConfiguredVaultZ,
  conversationId: string,
) {
  const fs = getConversationFs(vault.path);
  const registry = await fs.loadConversationsRegistry();
  const conversationWithPath = registry.conversations[conversationId];

  if (!conversationWithPath) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  await fs.deleteConversation(conversationWithPath.path);

  invalidateConversationsQuery(vault.path);
  invalidateConversationQuery(vault.id, conversationId);

  return true;
}
