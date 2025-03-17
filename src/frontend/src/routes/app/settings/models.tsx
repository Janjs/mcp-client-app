import { ModelsManagement } from "@features/models/frontend/ModelsManagement";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings/models")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ModelsManagement />;
}
