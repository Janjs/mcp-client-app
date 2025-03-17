import { app } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { moduleManager } from "./module-manager";
import { windowManager } from "./window-manager";
import { CORE_MODULES, MODULES } from "./modules";

/**
 * App initializer to handle application setup and lifecycle
 */
class AppInitializer {
  /**
   * Initialize the application
   */
  initialize(): void {
    // When app is ready, setup everything
    app.whenReady().then(() => {
      this.setupElectronApp();
      this.registerApplicationModules();
      this.setupAppEvents();

      // Create the initial window
      windowManager.createWindow();
    });

    // Set up shutdown handlers
    this.setupShutdownHandlers();
  }

  /**
   * Set up basic Electron app configuration
   */
  private setupElectronApp(): void {
    // Set app user model id for windows
    electronApp.setAppUserModelId("com.electron");

    // Setup default behavior for windows
    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });
  }

  /**
   * Register and initialize all application modules
   */
  private registerApplicationModules(): void {
    // Register core modules
    CORE_MODULES.forEach((module) => {
      moduleManager.registerModule(module);
    });

    // Register feature modules
    MODULES.forEach((module) => {
      moduleManager.registerModule(module);
    });

    // Initialize all modules
    moduleManager.setupAllModules();
  }

  /**
   * Setup app-specific event handlers
   */
  private setupAppEvents(): void {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on("activate", () => {
      if (windowManager.getWindowCount() === 0) {
        windowManager.createWindow();
      }
    });
  }

  /**
   * Setup handlers for app shutdown
   */
  private setupShutdownHandlers(): void {
    // Quit when all windows are closed, even on macOS.
    app.on("window-all-closed", () => {
      if (process.platform === "darwin") {
        console.log("Quitting on macOS");
      }
      app.exit(0);
    });

    // Handle app shutdown
    app.on("will-quit", async (event) => {
      // Prevent immediate shutdown to allow cleanup
      event.preventDefault();

      try {
        // Clean up all windows
        windowManager.cleanupAllWindows();

        // Clean up all modules
        console.log("Cleaning up modules before quitting");
        moduleManager.cleanupAllModules();

        // Now we can safely quit
        app.exit(0);
      } catch (error) {
        console.error("Error during app cleanup:", error);
        app.exit(1); // Force quit with error code in case of failure
      }
    });
  }
}

// Export singleton instance
export const appInitializer = new AppInitializer();
