import { ConversationsPage } from "@features/conversations/renderer";
import { createFileRoute } from "@tanstack/react-router";
import { useVaults } from "@features/vault/renderer/hooks/useVaults";
export const Route = createFileRoute("/app/conversations/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { activeVault } = useVaults();

  if (!activeVault) {
    return <div>No active vault</div>;
  }

  return <ConversationsPage />;
}
