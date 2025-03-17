import { ConversationPage } from "@features/conversations/frontend";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/conversations/$conversationId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { conversationId } = Route.useParams();

  return <ConversationPage conversationId={conversationId} />;
}
