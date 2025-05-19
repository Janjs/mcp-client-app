import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppProviders } from "../components/providers/app-providers";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createRootRoute({
  component: () => (
    <>
      <AppProviders>
        <div
          style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 50 }}
        >
          <ThemeToggle />
        </div>
        <Outlet />
      </AppProviders>
    </>
  ),
});
