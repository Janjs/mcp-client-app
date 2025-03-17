import { systemPromptBase } from "./system";

export async function buildSystemPrompt() {
  return systemPromptBase({
    currentDateTime: new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}
