import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { McpServerConfig, ClaudeApiConfig } from '../types';

class ConfigStore {
  private configPath: string;
  private defaultConfig = {
    mcpServers: [] as McpServerConfig[],
    claudeApi: {
      apiKey: '',
      model: 'claude-3-5-sonnet-latest'
    } as ClaudeApiConfig
  };
  private config: {
    mcpServers: McpServerConfig[];
    claudeApi: ClaudeApiConfig;
  };

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      }
      return this.defaultConfig;
    } catch (error) {
      console.error('Failed to load config:', error);
      return this.defaultConfig;
    }
  }

  private saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  // MCP Server configurations
  getMcpServers(): McpServerConfig[] {
    return this.config.mcpServers;
  }

  getMcpServerById(id: string): McpServerConfig | undefined {
    return this.config.mcpServers.find(server => server.id === id);
  }

  addMcpServer(server: McpServerConfig): string {
    if (!server.id) {
      server.id = Date.now().toString();
    }
    this.config.mcpServers.push(server);
    this.saveConfig();
    return server.id;
  }

  updateMcpServer(server: McpServerConfig): boolean {
    const index = this.config.mcpServers.findIndex(s => s.id === server.id);
    if (index >= 0) {
      this.config.mcpServers[index] = server;
      this.saveConfig();
      return true;
    }
    return false;
  }

  removeMcpServer(id: string): boolean {
    const initialLength = this.config.mcpServers.length;
    this.config.mcpServers = this.config.mcpServers.filter(server => server.id !== id);
    if (this.config.mcpServers.length !== initialLength) {
      this.saveConfig();
      return true;
    }
    return false;
  }

  // Claude API Configuration
  getClaudeApiConfig(): ClaudeApiConfig {
    return this.config.claudeApi;
  }

  updateClaudeApiConfig(config: Partial<ClaudeApiConfig>): void {
    this.config.claudeApi = { ...this.config.claudeApi, ...config };
    this.saveConfig();
  }
}

// Export a singleton instance
export const configStore = new ConfigStore(); 