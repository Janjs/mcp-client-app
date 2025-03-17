import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { McpServerZ } from "@core/validation/mcp-servers-schema";
import { ConnectionStatusMap } from "../types/connection-types";
import {
  useMcpConnectionActions,
  useMcpServerConnections,
} from "../queries/useMcpConnection";

interface McpServerCardProps {
  server: McpServerZ;
  onEdit: (server: McpServerZ) => void;
  onDelete: (serverId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const McpServerCard: React.FC<McpServerCardProps> = ({
  server,
  onEdit,
  onDelete,
  isUpdating,
  isDeleting,
}) => {
  // Get connection state from the store
  const { data: connections } = useMcpServerConnections();
  const { connectToServer, disconnectFromServer } = useMcpConnectionActions();

  const connectionState = connections?.find(
    (connection) => connection.serverId === server.id,
  );
  const status = connectionState?.info.status;
  const isConnected = status === ConnectionStatusMap.CONNECTED;
  const isConnecting = status === ConnectionStatusMap.CONNECTING;
  const isError = status === ConnectionStatusMap.ERROR;
  const tools = connectionState?.info.tools || [];

  // Handle delete confirmation
  const handleDeleteClick = () => {
    if (confirm("Are you sure you want to delete this MCP server?")) {
      onDelete(server.id);
    }
  };

  // Handle connection toggle
  const handleConnectionToggle = async () => {
    if (isConnected) {
      await disconnectFromServer.mutateAsync(server.id);
    } else {
      await connectToServer.mutateAsync(server.id);
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? "bg-green-500"
                  : isConnecting
                    ? "bg-yellow-500"
                    : isError
                      ? "bg-red-500"
                      : "bg-gray-400"
              }`}
              title={status || "Not connected"}
            />
            <CardTitle className="font-semibold text-lg">
              {server.name}
            </CardTitle>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs uppercase ${
              server.type === "command"
                ? "bg-purple-100 text-purple-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {server.type}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {server.type === "command" && (
          <div className="mb-2">
            <span className="text-sm text-gray-500">Command:</span>
            <div className="mt-1 bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto">
              {server.config.command}
            </div>
          </div>
        )}

        {server.type === "sse" && (
          <div className="mb-2">
            <span className="text-sm text-gray-500">URL:</span>
            <div className="mt-1 bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto">
              {server.config.url}
            </div>
          </div>
        )}

        {isConnected && tools.length > 0 && (
          <div className="mt-4">
            <span className="text-sm text-gray-500">Available Tools:</span>
            <div className="mt-2 grid gap-1">
              {tools.map((tool, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-2 rounded border border-gray-200"
                >
                  <div className="font-medium text-sm">{tool.name}</div>
                  {tool.description && (
                    <div className="text-xs text-gray-600 mt-1">
                      {tool.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        <Button
          variant={isConnected ? "outline" : "default"}
          size="sm"
          onClick={handleConnectionToggle}
          disabled={isConnecting}
        >
          {isConnecting
            ? "Connecting..."
            : isConnected
              ? "Disconnect"
              : "Connect"}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(server)}
            disabled={isUpdating}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
