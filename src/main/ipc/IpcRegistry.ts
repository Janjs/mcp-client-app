import { BrowserWindow, IpcMain, ipcMain } from 'electron';

type IpcHandler = (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any;
type IpcListener = (event: Electron.IpcMainEvent, ...args: any[]) => void;

/**
 * A registry for IPC handlers that allows for easy registration and organization of IPC methods
 */
export class IpcRegistry {
  private handlersMap: Map<string, IpcHandler> = new Map();
  private listenersMap: Map<string, IpcListener> = new Map();
  private ipcMain: IpcMain;
  
  constructor() {
    this.ipcMain = ipcMain;
  }
  
  /**
   * Register an IPC handler for invoke calls
   */
  registerHandler(channel: string, handler: IpcHandler): void {
    // Check if handler is already registered
    if (this.handlersMap.has(channel)) {
      // Remove the existing handler first
      this.ipcMain.removeHandler(channel);
    }
    
    // Register the new handler
    this.ipcMain.handle(channel, handler);
    this.handlersMap.set(channel, handler);
    
    console.log(`Registered IPC handler for channel: ${channel}`);
  }
  
  /**
   * Register an IPC listener for on/send calls
   */
  registerListener(channel: string, listener: IpcListener): void {
    // If we already have a listener for this channel, remove it
    if (this.listenersMap.has(channel)) {
      this.ipcMain.removeListener(channel, this.listenersMap.get(channel)!);
    }
    
    // Register the new listener
    this.ipcMain.on(channel, listener);
    this.listenersMap.set(channel, listener);
    
    console.log(`Registered IPC listener for channel: ${channel}`);
  }
  
  /**
   * Remove an IPC handler
   */
  removeHandler(channel: string): void {
    if (this.handlersMap.has(channel)) {
      this.ipcMain.removeHandler(channel);
      this.handlersMap.delete(channel);
      console.log(`Removed IPC handler for channel: ${channel}`);
    }
  }
  
  /**
   * Remove an IPC listener
   */
  removeListener(channel: string): void {
    if (this.listenersMap.has(channel)) {
      this.ipcMain.removeListener(channel, this.listenersMap.get(channel)!);
      this.listenersMap.delete(channel);
      console.log(`Removed IPC listener for channel: ${channel}`);
    }
  }
  
  /**
   * Clear all registered handlers and listeners
   */
  clearAll(): void {
    // Clear all handlers
    for (const channel of this.handlersMap.keys()) {
      this.ipcMain.removeHandler(channel);
    }
    this.handlersMap.clear();
    
    // Clear all listeners
    for (const [channel, listener] of this.listenersMap.entries()) {
      this.ipcMain.removeListener(channel, listener);
    }
    this.listenersMap.clear();
    
    console.log('Cleared all IPC handlers and listeners');
  }
  
  /**
   * Send a message to a window
   */
  send(window: BrowserWindow, channel: string, ...args: any[]): void {
    window.webContents.send(channel, ...args);
  }
}

// Export singleton instance
export const ipcRegistry = new IpcRegistry(); 