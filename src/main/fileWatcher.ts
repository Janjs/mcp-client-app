import { ipcMain } from 'electron';
import * as chokidar from 'chokidar';
import * as path from 'path';

// Map to keep track of active watchers
const activeWatchers: Map<string, chokidar.FSWatcher> = new Map();

// Define event channels for IPC communication
const WATCH_DIRECTORY_CHANNEL = 'watch-directory';
const UNWATCH_DIRECTORY_CHANNEL = 'unwatch-directory';
const FILE_CHANGE_EVENT = 'file-change';

/**
 * Initialize file system watchers
 */
export function initializeFileWatchers() {
  // Handle watch directory requests
  ipcMain.on(WATCH_DIRECTORY_CHANNEL, (event, directoryPath: string) => {
    if (activeWatchers.has(directoryPath)) {
      console.log(`Already watching directory: ${directoryPath}`);
      return;
    }
    
    console.log(`Starting watcher for directory: ${directoryPath}`);
    
    // Create a new watcher
    const watcher = chokidar.watch(directoryPath, {
      persistent: true,
      ignoreInitial: true,
      ignored: [
        // Ignore dot files and temporary files
        /(^|[\/\\])\../, 
        '**/*.tmp',
        '**/*.temp',
        // Ignore node_modules if it exists in the vault
        '**/node_modules/**',
        // Don't watch the filetree.yaml file itself to prevent loops
        path.join(directoryPath, '.vault', 'filetree.yaml'),
      ],
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });
    
    // Set up event handlers
    const sendChangeEvent = (type: string, changedPath: string) => {
      // Don't send events for paths we're ignoring
      if (changedPath.includes('node_modules') || 
          changedPath.includes('.vault/filetree.yaml')) {
        return;
      }
      
      event.sender.send(FILE_CHANGE_EVENT, {
        type,
        path: changedPath
      });
    };
    
    watcher
      .on('add', (filePath) => sendChangeEvent('add', filePath))
      .on('change', (filePath) => sendChangeEvent('change', filePath))
      .on('unlink', (filePath) => sendChangeEvent('unlink', filePath))
      .on('addDir', (dirPath) => sendChangeEvent('addDir', dirPath))
      .on('unlinkDir', (dirPath) => sendChangeEvent('unlinkDir', dirPath))
      .on('error', (error) => console.error(`Watcher error: ${error}`));
    
    // Store the watcher
    activeWatchers.set(directoryPath, watcher);
  });
  
  // Handle unwatch requests
  ipcMain.on(UNWATCH_DIRECTORY_CHANNEL, (_, directoryPath: string) => {
    const watcher = activeWatchers.get(directoryPath);
    
    if (watcher) {
      console.log(`Stopping watcher for directory: ${directoryPath}`);
      watcher.close().then(() => {
        activeWatchers.delete(directoryPath);
      }).catch(err => {
        console.error(`Error closing watcher: ${err}`);
      });
    }
  });
}

/**
 * Clean up all active watchers
 */
export function cleanupFileWatchers() {
  for (const [directoryPath, watcher] of activeWatchers.entries()) {
    console.log(`Cleaning up watcher for directory: ${directoryPath}`);
    watcher.close().catch(err => {
      console.error(`Error closing watcher during cleanup: ${err}`);
    });
  }
  
  activeWatchers.clear();
} 