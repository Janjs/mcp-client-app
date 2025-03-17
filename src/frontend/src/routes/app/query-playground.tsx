import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/query-playground")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/query-playground"!</div>;
}
