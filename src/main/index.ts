import { app, shell, BrowserWindow } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { setupVaultIpcHandlers } from "../features/vault/main";
import { setupMcpServersIpcHandlers } from "../features/mcp-servers/main";
import { initializeFileWatchers, cleanupFileWatchers } from "./fileWatcher";
import { removeWindowVaultAssociation } from "../features/vault/main/window-vault-manager";
import { setupMcpConnectionIpcHandlers } from "@features/mcp-servers/main/mcp-connection-ipc-handler";

// Type augmentation for import.meta.env
declare global {
  interface ImportMetaEnv {
    MAIN_VITE_ANTHROPIC_API_KEY: string;
  }
}

/**
 * Create the main application window
 */
function createWindow(): void {
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

  window.on("ready-to-show", () => {
    console.log("ready to show");
    window.showInactive();
  });

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // Handle window closing to clean up associated vault
  window.on("closed", () => {
    console.log(`Window ${window.id} closed, cleaning up vault association`);
    removeWindowVaultAssociation(window.id);
  });

  // Load the appropriate URL
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    window.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    window.loadFile(join(__dirname, "../renderer/index.html"));
  }

  // Setup things that depend on the window being created

  //
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default behavior: enable hardware acceleration if not explicitly disabled
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Register IPC handlers for vault management
  setupVaultIpcHandlers();

  // Register IPC handlers for MCP servers management
  setupMcpServersIpcHandlers();

  // Register IPC handlers for MCP connection management
  setupMcpConnectionIpcHandlers();

  // Create the initial window
  createWindow();

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // initialize other things
  initializeFileWatchers();
});

// Quit when all windows are closed, even on macOS.
// This differs from the standard macOS app behavior, but ensures the app fully quits when closed
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
    // Disconnect things here
    console.log("will quit");

    // Now we can safely quit
    app.exit(0);
  } catch (error) {
    console.error("Error during app cleanup:", error);
    app.exit(1); // Force quit with error code in case of failure
  } finally {
    cleanupFileWatchers();
  }
});
