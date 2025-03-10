import { ElectronAPI } from "@electron-toolkit/preload";
import {
  McpServerConfig,
  ClaudeApiConfig,
  McpTool,
  McpToolContent,
} from "../main/types";
import { VaultAPI } from "../features/vault/preload";
import { McpServersAPI } from "../features/mcp-servers/preload";
import { McpConnectionAPI } from "../features/mcp-servers/preload/mcp-connection-api";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      vault: VaultAPI;
      mcpServers: McpServersAPI;
      mcpConnection: McpConnectionAPI;
    };
    environment: {
      isMac: boolean;
      isWindows: boolean;
      isLinux: boolean;
    };
  }
}
