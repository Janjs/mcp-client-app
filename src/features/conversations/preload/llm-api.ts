import { ipcRenderer } from "electron";
import {
  MessageCompletionEvent,
  ToolCallEvent,
  MessageStreamEvent,
  MessageErrorEvent,
  LLM_CHANNELS,
  SendMessageParams,
  ToolCallUserResponse,
} from "../types";
import { CoreToolMessage } from "ai";
/**
 * API interface for LLM communication exposed to the renderer process
 */
export interface LlmAPI {
  /**
   * Sends a message to an LLM and streams the response
   * @param conversationId Conversation ID
   * @param messageId Message ID for tracking
   * @param messages Array of messages in the conversation
   * @param providerName LLM provider name (e.g., 'anthropic', 'openai')
   * @param modelName Model name to use
   */
  sendMessage: (params: SendMessageParams) => Promise<void>;

  /**
   * Sends a response to a tool call
   * @param params Tool call user response
   */
  respondToToolCall: (params: ToolCallUserResponse) => Promise<CoreToolMessage>;

  /**
   * Registers a listener for message stream events
   * @param callback Function to call when a message chunk is received
   */
  onMessageStream: (
    callback: (event: MessageStreamEvent) => void,
  ) => () => void;

  /**
   * Registers a listener for tool call events
   * @param callback Function to call when a tool call is received
   */
  onToolCall: (callback: (event: ToolCallEvent) => void) => () => void;

  /**
   * Registers a listener for message completion events
   * @param callback Function to call when a message is completed
   */
  onMessageCompletion: (
    callback: (event: MessageCompletionEvent) => void,
  ) => () => void;

  /**
   * Registers a listener for message error events
   * @param callback Function to call when a message error occurs
   */
  onMessageError: (callback: (event: MessageErrorEvent) => void) => () => void;
}

/**
 * Implementation of the LLM API for the renderer process
 */
export const llmApi: LlmAPI = {
  sendMessage: (params: SendMessageParams) => {
    return ipcRenderer.invoke(LLM_CHANNELS.SEND_MESSAGE, params);
  },

  respondToToolCall: (params: ToolCallUserResponse) => {
    return ipcRenderer.invoke(LLM_CHANNELS.TOOL_CALL_RESPONSE, params);
  },

  onMessageStream: (callback) => {
    const listener = (_: unknown, data: MessageStreamEvent) => callback(data);
    ipcRenderer.on(LLM_CHANNELS.MESSAGE_STREAM, listener);
    return () => {
      ipcRenderer.removeListener(LLM_CHANNELS.MESSAGE_STREAM, listener);
    };
  },

  onToolCall: (callback) => {
    const listener = (_: unknown, data: ToolCallEvent) => callback(data);
    ipcRenderer.on(LLM_CHANNELS.TOOL_CALL, listener);
    return () => {
      ipcRenderer.removeListener(LLM_CHANNELS.TOOL_CALL, listener);
    };
  },

  onMessageCompletion: (callback) => {
    const listener = (_: unknown, data: MessageCompletionEvent) =>
      callback(data);
    ipcRenderer.on(LLM_CHANNELS.MESSAGE_COMPLETION, listener);
    return () => {
      ipcRenderer.removeListener(LLM_CHANNELS.MESSAGE_COMPLETION, listener);
    };
  },

  onMessageError: (callback) => {
    const listener = (_: unknown, data: MessageErrorEvent) => callback(data);
    ipcRenderer.on(LLM_CHANNELS.MESSAGE_ERROR, listener);
    return () => {
      ipcRenderer.removeListener(LLM_CHANNELS.MESSAGE_ERROR, listener);
    };
  },
};
