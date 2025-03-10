import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { useMcpConnectionListener } from "@features/mcp-servers/renderer/queries/useMcpConnection";

const queryClient = new QueryClient();

function TSQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function McpConnectionProvider({ children }: { children: React.ReactNode }) {
  useMcpConnectionListener();
  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TSQueryProvider>
      <McpConnectionProvider>{children}</McpConnectionProvider>

      <Toaster />
      <TanStackRouterDevtools />
    </TSQueryProvider>
  );
}
