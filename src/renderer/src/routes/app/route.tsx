import { AppSidebar } from "@/modules/shared/app-sidebar/app-sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppCommandMenu } from "@/modules/shared/app-command-menu/app-command-menu";

export const Route = createFileRoute("/app")({
  component: AppLayoutComponent,
});

function AppLayoutComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>

      <AppCommandMenu />
    </SidebarProvider>
  );
}
