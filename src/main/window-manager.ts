import { BrowserWindow, shell } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { moduleManager } from "./module-manager";

/**
 * Window manager to handle window creation and lifecycle
 */
class WindowManager {
  private windows: Set<number> = new Set();

  /**
   * Create a new application window
   */
  createWindow(): BrowserWindow {
    // Create the browser window
    const window = new BrowserWindow({
      width: 1024,
      height: 768,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === "linux" ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        sandbox: false,
      },
    });

    // Store window ID
    this.windows.add(window.id);

    // Setup window events
    window.on("ready-to-show", () => {
      console.log("Window ready to show");
      window.showInactive();
    });

    window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    // Setup all modules for this window
    moduleManager.setupWindowForAllModules(window);

    window.on("closed", () => {
      console.log(`Window ${window.id} closed, cleaning up`);
      // Clean up window modules
      moduleManager.cleanupWindowForAllModules(window);
      // Remove from windows registry
      this.windows.delete(window.id);
    });

    // Load the appropriate URL
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      window.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
      window.loadFile(join(__dirname, "../renderer/index.html"));
    }

    return window;
  }

  /**
   * Get all active windows
   */
  getWindowCount(): number {
    return this.windows.size;
  }

  /**
   * Clean up all windows (should be called on app exit)
   */
  cleanupAllWindows(): void {
    // Get all BrowserWindow instances
    const browserWindows = BrowserWindow.getAllWindows();

    // Only process windows we're tracking
    for (const window of browserWindows) {
      if (this.windows.has(window.id)) {
        try {
          console.log(`Cleaning up window ${window.id}`);
          moduleManager.cleanupWindowForAllModules(window);
          this.windows.delete(window.id);
        } catch (error) {
          console.error(`Error cleaning up window ${window.id}:`, error);
        }
      }
    }
  }
}

// Export singleton instance
export const windowManager = new WindowManager();
