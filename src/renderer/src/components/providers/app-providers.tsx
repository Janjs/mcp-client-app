import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

function TSQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TSQueryProvider>
      {children}

      <Toaster />
      <TanStackRouterDevtools />
    </TSQueryProvider>
  );
}
