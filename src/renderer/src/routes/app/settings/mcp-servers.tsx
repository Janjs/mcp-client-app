import { createFileRoute } from "@tanstack/react-router";
import { McpServersManagement } from "@features/mcp-servers/renderer";

export const Route = createFileRoute("/app/settings/mcp-servers")({
  component: McpServersManagementPage,
});

function McpServersManagementPage() {
  return <McpServersManagement />;
} 