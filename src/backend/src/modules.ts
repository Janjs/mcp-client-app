import { VaultModule } from "@features/vault/backend";
import { AppModule } from "./types";
import { FileWatcherModule } from "./fileWatcher";
import { McpServersModule } from "@features/mcp-servers/backend";
import { ModelsModule } from "@features/models/backend";
import { ConversationsModule } from "@features/conversations/backend";

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
