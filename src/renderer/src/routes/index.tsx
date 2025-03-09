import { VaultSelector } from "@features/vault/renderer/components/VaultSelector";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useVaults } from "@features/vault/renderer/hooks/useVaults";

export const Route = createFileRoute("/")({
  component: Index,
});

function InnerContent() {
  const { activeVault, loading } = useVaults();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!activeVault) {
    return <VaultSelector />;
  }

  return <Navigate to={`/app/vault`} />;
}

function Index() {
  return (
    <div className="min-h-screen bg-gray-50">
      <InnerContent />
    </div>
  );
}
