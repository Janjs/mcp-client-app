import { BrowserWindow } from "electron";

export interface AppModule {
  // The name of the module
  name: string;

  // Setup and cleanup for windows
  setupWindow: (window: BrowserWindow) => void;
  cleanupWindow: (window: BrowserWindow) => void;

  // Setup and cleanup for the main process
  setupModule: () => void;
  cleanupModule: () => void;
}
