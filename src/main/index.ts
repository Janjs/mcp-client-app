import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Import services and IPC handlers
import { ipcRegistry } from './ipc/IpcRegistry'
import { registerMcpIpcHandlers } from './ipc/McpIpcHandlers'
import { registerClaudeIpcHandlers } from './ipc/ClaudeIpcHandlers'

// Import new modular services
import { ToolRegistry } from './services/tool/ToolRegistry'
import { McpToolProvider } from './services/tool/McpToolProvider'
import { LlmProviderFactory, LlmProviderType } from './services/llm/LlmProviderFactory'
import { configStore } from './config/store'

// Type augmentation for import.meta.env
declare global {
  interface ImportMetaEnv {
    MAIN_VITE_ANTHROPIC_API_KEY: string
  }
}

// Create service singletons
const toolRegistry = new ToolRegistry()
let claudeProvider: ReturnType<typeof LlmProviderFactory.createProvider>

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
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the appropriate URL
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Setup IPC handlers once the window is created
  setupIpcHandlers(window)
}

/**
 * Initialize IPC handlers for main window
 */
function setupIpcHandlers(mainWindow: BrowserWindow): void {
  // Create Claude provider with main window reference
  const claudeConfig = configStore.getClaudeApiConfig()
  claudeProvider = LlmProviderFactory.createProvider(
    LlmProviderType.CLAUDE,
    claudeConfig,
    toolRegistry,
    mainWindow
  )

  // Register MCP IPC handlers with toolRegistry
  registerMcpIpcHandlers(mainWindow, toolRegistry)
  
  // Register Claude API IPC handlers with llmProvider
  registerClaudeIpcHandlers(mainWindow, claudeProvider)
}

/**
 * Initialize app-wide services
 */
async function initializeServices(): Promise<void> {
  // Initialize Claude provider with API key from environment or config
  const apiKey = import.meta.env.MAIN_VITE_ANTHROPIC_API_KEY || ''
  const claudeConfig = configStore.getClaudeApiConfig()
  
  if (apiKey && !claudeConfig.apiKey) {
    configStore.updateClaudeApiConfig({
      apiKey,
      model: claudeConfig.model
    })
  }
  
  // Initialize MCP providers from config
  const mcpServers = configStore.getMcpServers()
  console.log(`Initializing ${mcpServers.length} MCP server configurations:`, 
    mcpServers.map(s => `${s.id}(${s.name})`))
    
  for (const serverConfig of mcpServers) {
    console.log(`Creating provider for server ${serverConfig.id}(${serverConfig.name})`)
    // Create and register MCP providers
    const provider = new McpToolProvider(serverConfig)
    toolRegistry.registerMcpProvider(serverConfig.id, provider)
    console.log(`Registered provider for ${serverConfig.id}`)
    
    // Connect to auto-connect servers
    if (serverConfig.autoConnect) {
      try {
        console.log(`Auto-connecting to server ${serverConfig.id}`)
        await toolRegistry.connectToServer(serverConfig.id)
        console.log(`Successfully connected to ${serverConfig.id}`)
      } catch (error) {
        console.error(`Failed to auto-connect to MCP server ${serverConfig.name}:`, error)
      }
    }
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  
  // Default behavior: enable hardware acceleration if not explicitly disabled
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  
  // Initialize services before creating window
  initializeServices()
    .then(() => {
      createWindow()
    })
    .catch(err => {
      console.error('Error initializing services:', err)
      createWindow() // Still create window even if services fail
    })
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, even on macOS.
// This differs from the standard macOS app behavior, but ensures the app fully quits when closed
app.on('window-all-closed', () => {
  app.quit()
})

// Handle app shutdown
app.on('will-quit', async (event) => {
  // Prevent immediate shutdown to allow cleanup
  event.preventDefault()
  
  try {
    // Disconnect from all MCP servers
    await toolRegistry.disconnectAll()
    
    // Clear all IPC handlers
    ipcRegistry.clearAll()
    
    // Now we can safely quit
    app.quit()
  } catch (error) {
    console.error('Error during app cleanup:', error)
    app.exit(1) // Force quit with error code in case of failure
  }
})
