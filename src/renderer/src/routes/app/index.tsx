import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/modules/shared/page-header/page-header";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [count, setCount] = useState(0);
  const [shortcut, setShortcut] = useState("a");

  useHotkeys(shortcut, () => setCount((count) => count + 1));

  return (
    <>
      <PageHeader title="MCP Client" />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">MCP Client</h1>
          <p className="text-sm text-muted-foreground">
            Welcome to the MCP Client
          </p>

          <Button onClick={() => setCount((count) => count + 1)}>
            Click me
          </Button>

          <p>Count: {count}</p>

          <div className="flex gap-2">
            <Switch
              checked={shortcut === "a"}
              onCheckedChange={(checked) => setShortcut(checked ? "a" : "c")}
            />
            <Switch
              checked={shortcut === "c"}
              onCheckedChange={(checked) => setShortcut(checked ? "c" : "a")}
            />
          </div>
        </div>
      </div>
    </>
  );
}
