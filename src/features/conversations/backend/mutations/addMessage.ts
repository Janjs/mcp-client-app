import { ConfiguredVaultZ } from "@core/validation/schema";
import { CoreMessage } from "ai";
import {
  getConversationQuery,
  invalidateConversationQuery,
} from "../queries/getConversation";
import { updateConversationMutation } from "./updateConversation";

export async function addMessageMutation(
  vault: ConfiguredVaultZ,
  conversationId: string,
  message: CoreMessage,
) {
  const conversation = await getConversationQuery(vault, conversationId);

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  await updateConversationMutation(vault, conversationId, {
    messages: [...conversation.messages, message],
  });

  invalidateConversationQuery(vault.id, conversationId);

  return true;
}

export async function addMessagesMutation(
  vault: ConfiguredVaultZ,
  conversationId: string,
  messages: CoreMessage[],
) {
  const conversation = await getConversationQuery(vault, conversationId);

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  await updateConversationMutation(vault, conversationId, {
    messages: [...conversation.messages, ...messages],
  });

  invalidateConversationQuery(vault.id, conversationId);

  return true;
}
