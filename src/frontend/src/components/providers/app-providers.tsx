import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { useMcpConnectionListener } from "@features/mcp-servers/frontend/queries/useMcpConnection";
import { queryClient } from "@/lib/query";

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
