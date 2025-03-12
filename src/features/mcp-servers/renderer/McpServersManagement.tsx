import React from 'react';
import { McpServerList } from './components';

/**
 * MCP Servers Management Page
 * 
 * Main page for managing MCP servers
 */
export const McpServersManagement: React.FC = () => {
  return (
    <div className="p-6">
      <McpServerList />
    </div>
  );
}; 