/**
 * Export Models functionality for use in the main process
 */
import { BrowserWindow } from "electron";
import { AppModule } from "@backend/types";
import {
  setupModelsIpcHandlers,
  removeModelsIpcHandlers,
} from "./models-ipc-handler";

/**
 * Models Module implementation
 */
export const ModelsModule: AppModule = {
  name: "Models",

  setupWindow: (_window: BrowserWindow) => {
    // No window-specific setup needed for Models
  },

  cleanupWindow: (_window: BrowserWindow) => {
    // No window-specific cleanup needed for Models
  },

  setupModule: () => {
    console.log("Setting up Models module");
    setupModelsIpcHandlers();
  },

  cleanupModule: () => {
    console.log("Cleaning up Models module");
    removeModelsIpcHandlers();
  },
};
