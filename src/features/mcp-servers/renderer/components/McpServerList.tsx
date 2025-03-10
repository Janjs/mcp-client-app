import React, { useState } from "react";
import { useMcpServers } from "../hooks";
import { McpServerFormDialog } from "./McpServerFormDialog";
import { McpServerCard } from "./McpServerCard";
import { McpServerZ } from "@core/validation/mcp-servers-schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Empty State Component
 */
const EmptyState = () => (
  <Card className="text-center py-6 border-2 border-dashed">
    <CardContent>
      <p className="text-gray-500">
        No MCP servers found. Click the button above to add one.
      </p>
    </CardContent>
  </Card>
);

/**
 * Loading State Component
 */
const LoadingState = () => (
  <div className="flex justify-center items-center h-full">
    <p className="text-muted-foreground">Loading MCP servers...</p>
  </div>
);

/**
 * Error State Component
 */
const ErrorState = ({ error }: { error: Error }) => (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="p-4">
      <p className="text-red-500">
        Error loading MCP servers: {error.toString()}
      </p>
    </CardContent>
  </Card>
);

/**
 * Header Component
 */
const McpServerListHeader = ({
  onAddClick,
  isAdding,
}: {
  onAddClick: () => void;
  isAdding: boolean;
}) => (
  <div className="flex justify-between items-center mb-6">
    <CardTitle className="text-2xl font-bold">MCP Servers</CardTitle>
    <Button onClick={onAddClick} disabled={isAdding}>
      Add New MCP Server
    </Button>
  </div>
);

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
    console.log("Form submitted:", server);

    if (selectedServer) {
      // Update existing server
      console.log("Updating server:", server);
      updateMcpServer({ serverId: selectedServer.id, server });
    } else {
      // Add new server
      addMcpServer(server);
    }
    setFormOpen(false);
  };

  // Close the form dialog
  const handleFormClose = () => {
    setFormOpen(false);
  };

  // Prepare servers list
  const serversList = Object.values(mcpServers);

  return (
    <Card className="p-6 max-w-6xl mx-auto">
      <CardHeader className="p-0 pb-6">
        <McpServerListHeader
          onAddClick={handleAddClick}
          isAdding={isAddingMcpServer}
        />
      </CardHeader>

      <CardDescription className="p-0">
        <p className="text-sm text-gray-500">
          MCP servers are used to augment LLMs with access to external tools.
        </p>
      </CardDescription>

      <CardContent className="p-0">
        {isLoading && <LoadingState />}

        {error && <ErrorState error={error} />}

        {!isLoading && !error && serversList.length === 0 && <EmptyState />}

        {!isLoading && !error && serversList.length > 0 && (
          <div className="space-y-4">
            {serversList.map((server) => (
              <McpServerCard
                key={server.id}
                server={server}
                onEdit={handleEditClick}
                onDelete={removeMcpServer}
                isUpdating={isUpdatingMcpServer}
                isDeleting={isRemovingMcpServer}
              />
            ))}
          </div>
        )}
      </CardContent>

      <McpServerFormDialog
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        server={selectedServer}
        isSubmitting={selectedServer ? isUpdatingMcpServer : isAddingMcpServer}
      />
    </Card>
  );
};
