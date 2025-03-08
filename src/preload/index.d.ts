import { ElectronAPI } from "@electron-toolkit/preload";
import {
  McpServerConfig,
  ClaudeApiConfig,
  McpTool,
  McpToolContent,
} from "../main/types";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {};
  }
}
