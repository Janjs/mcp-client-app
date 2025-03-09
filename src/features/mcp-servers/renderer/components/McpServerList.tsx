import React, { useState } from 'react';
import { useMcpServers } from '../hooks';
import { McpServerFormDialog } from './McpServerFormDialog';
import { McpServerZ } from '../../../../core/validation/mcp-servers-schema';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

/**
 * MCP Server List Component
 * 
 * Displays a list of MCP servers with add, edit, and delete capabilities
 */
export const McpServerList: React.FC = () => {
  const {
    mcpServers,
    isLoading,
    error,
    addMcpServer,
    updateMcpServer,
    removeMcpServer,
    isAddingMcpServer,
    isUpdatingMcpServer,
    isRemovingMcpServer,
  } = useMcpServers();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<McpServerZ | null>(null);

  // Open the form dialog to add a new server
  const handleAddClick = () => {
    setSelectedServer(null);
    setFormOpen(true);
  };

  // Open the form dialog to edit an existing server
  const handleEditClick = (server: McpServerZ) => {
    setSelectedServer(server);
    setFormOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = (server: McpServerZ) => {
    if (selectedServer) {
      // Update existing server
      updateMcpServer({ serverId: selectedServer.id, server });
    } else {
      // Add new server
      const serverWithId = { ...server, id: server.id || uuidv4() };
      addMcpServer(serverWithId);
    }
    setFormOpen(false);
  };

  // Handle server deletion
  const handleDeleteClick = (serverId: string) => {
    if (confirm('Are you sure you want to delete this MCP server?')) {
      removeMcpServer(serverId);
    }
  };

  // Close the form dialog
  const handleFormClose = () => {
    setFormOpen(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading MCP servers...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading MCP servers: {error.toString()}</div>;
  }

  const serversList = Object.values(mcpServers);

  return (
    <div className="flex flex-col p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-blue-300">
        <h1 className="text-2xl font-bold">MCP Servers</h1>
        <Button
          onClick={handleAddClick}
          disabled={isAddingMcpServer}
        >
          Add New MCP Server
        </Button>
      </div>

      {serversList.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg border-gray-300">
          <p className="text-gray-500">No MCP servers found. Click the button above to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serversList.map((server) => (
            <div
              key={server.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{server.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs uppercase ${
                      server.type === 'command'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {server.type}
                  </span>
                </div>
              </div>
              <div className="p-4">
                {server.type === 'command' && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Command:</span>
                    <div className="mt-1 bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto">
                      {server.config.command}
                    </div>
                  </div>
                )}
                {server.type === 'sse' && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">URL:</span>
                    <div className="mt-1 bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto">
                      {server.config.url}
                    </div>
                  </div>
                )}
                <div className="flex justify-end mt-4 gap-2">
                  <button
                    onClick={() => handleEditClick(server)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm"
                    disabled={isUpdatingMcpServer}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(server.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                    disabled={isRemovingMcpServer}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <McpServerFormDialog
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        server={selectedServer}
      />
    </div>
  );
}; 