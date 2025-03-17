// Re-exporting the connection types for renderer use
// We can't directly import from the main process in the renderer

import { ToolSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const ConnectionStatusMap = {
  DISCONNECTED: "DISCONNECTED",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  DISCONNECTING: "DISCONNECTING",
  ERROR: "ERROR",
} as const;

export type ConnectionStatus =
  (typeof ConnectionStatusMap)[keyof typeof ConnectionStatusMap];

export type ConnectionTool = z.infer<typeof ToolSchema>;
