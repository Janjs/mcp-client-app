## SpecStory

## Implementing Message Roles in AI SDK (3/7/2025, 1:33:30 AM)

_**User**_

Instead of using just the prompt parameter in the streamText call of the ai sdk,

I want your help to use the "messages" array, and the message being added can have added role, which by default will be set to user, responses from the ai should be saved in a conversation array to keep the conversation context intact, tool calls should be added to the conversation with a "role": "tool"

---

_**Assistant**_

<think>I need to modify the `ClaudeService` class to use a conversation-based approach with the `messages` array instead of a single `prompt` parameter. Let's first understand what needs to be changed:

1. Update the `sendMessage` method to use `messages` instead of `prompt`
2. Implement a system to maintain conversation context
3. Add support for different message roles (user, assistant, tool)
4. Ensure tool calls are properly added to the conversation with role "tool"

Let me look at the relevant code to understand the current implementation better, particularly the `sendMessage` method and any related code.

From what I can see in the cursory view, we need to modify the `streamText` call on lines 237-242, changing from:

```typescript
const { textStream } = await streamText({
  model: anthropic(this.model),
  prompt: message,
  system: enhancedSystemPrompt,
  tools: toolsDefinition
})
```

to something that uses the `messages` array instead.

I should also look at how to track the conversation history, add tool call responses to it, and maintain the proper message roles.</think>Good evening, Sir. I see you want to modernize the Claude service to use the more structured messages array approach rather than the prompt parameter. This will allow for better conversation tracking and proper role attribution. I'll implement this right away.

Let me look at the current implementation to understand how to best integrate this change.

---

_****_

Read file: src/main/services/ClaudeService.ts

---

_****_

Now I'll check if there are any imported types or interfaces related to the messages format that I should be aware of:

---

_****_



---

_****_

Read file: src/main/types/index.ts

---

_****_

Now let me check the AI SDK documentation to understand how to properly use the messages array:

---

_****_



---

_****_



---



---

