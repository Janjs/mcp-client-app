import { VaultModule } from "@features/vault/main";
import { AppModule } from "./types";
import { FileWatcherModule } from "./fileWatcher";
import { McpServersModule } from "@features/mcp-servers/main";
import { ModelsModule } from "@features/models/main";
import { ConversationsModule } from "@features/conversations/main";

/**
 * Core modules
 */
export const CORE_MODULES: AppModule[] = [FileWatcherModule];

/**
 * Feature modules
 */
export const MODULES: AppModule[] = [
  VaultModule,
  McpServersModule,
  ModelsModule,
  ConversationsModule,
];
