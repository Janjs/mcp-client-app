// This is a new implementation that uses the Electron IPC bridge instead of direct MCP SDK usage

// Event listeners and their callbacks
type MessageListener = (message: string) => void;
type ErrorListener = (error: string) => void;

class McpService {
  private isConnected = false;
  private messageListeners: MessageListener[] = [];
  private errorListeners: ErrorListener[] = [];

  constructor() {
    // Set up event listeners
    window.api.mcp.onReceiveMessage((message: string) => {
      this.messageListeners.forEach(listener => listener(message));
    });

    window.api.mcp.onError((error: string) => {
      this.errorListeners.forEach(listener => listener(error));
    });
  }

  async connect(serverPath: string, args: string[] = []): Promise<void> {
    try {
      await window.api.mcp.connectToServer(serverPath, args);
      this.isConnected = true;
      console.log('Connected to MCP server');
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await window.api.mcp.disconnectFromServer();
      this.isConnected = false;
      console.log('Disconnected from MCP server');
    }
  }

  sendMessage(message: string): void {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }
    window.api.mcp.sendMessage(message);
  }

  onMessage(callback: MessageListener): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  onError(callback: ErrorListener): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(listener => listener !== callback);
    };
  }

  // Check if connected
  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Export a singleton instance
const mcpService = new McpService();
export default mcpService; 