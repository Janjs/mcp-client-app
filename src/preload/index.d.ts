import { ElectronAPI } from "@electron-toolkit/preload";
import {
  McpServerConfig,
  ClaudeApiConfig,
  McpTool,
  McpToolContent,
} from "../main/types";
import { VaultAPI } from "../features/vault/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      vault: VaultAPI;
    };
    environment: {
      isMac: boolean;
      isWindows: boolean;
      isLinux: boolean;
    };
  }
}
