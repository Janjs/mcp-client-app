import path from "path";
import { Conversation } from "@features/conversations/types";
import { getConversationFs } from "../services/conversation-fs";
import { v4 as uuidv4 } from "uuid";
import { randomUUID } from "node:crypto";
import { invalidateConversationsQuery } from "../queries/getConversations";

function generateFilename() {
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const randomId = randomUUID().slice(0, 8);
  return `${timestamp}-cvs-${randomId}.json`;
}

export async function createConversationMutation(
  vaultPath: string,
  name: string,
) {
  const fs = getConversationFs(vaultPath);

  const id = uuidv4();
  const now = new Date().toISOString();
  const basePath = fs.conversationsPath;
  const filename = generateFilename();
  const filePath = path.join(basePath, filename);

  const conversation: Conversation = {
    id,
    name: name || "New Conversation",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  await fs.saveConversation(filePath, conversation);
  await fs.addConversationToRegistry(conversation, filePath);

  invalidateConversationsQuery(vaultPath);

  return conversation;
}
