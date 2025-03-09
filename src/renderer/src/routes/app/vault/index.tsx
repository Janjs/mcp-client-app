import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/modules/shared/page-header/page-header";

export const Route = createFileRoute("/app/vault/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [count, setCount] = useState(0);
  const [shortcut, setShortcut] = useState("a");
  const activeVault = { name: "Demo Vault", path: "/path/to/vault" }; // Temporary mock

  useHotkeys(shortcut, () => setCount((count) => count + 1));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`Vault: ${activeVault?.name ?? "..."}`} />

      <div className="flex-1 p-4 overflow-auto">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Welcome to the MCP Client
            </p>

            <Button onClick={() => setCount((count) => count + 1)}>
              Click me
            </Button>

            <p>Count: {count}</p>

            <div className="flex gap-2">
              <RadioGroup value={shortcut} onValueChange={setShortcut}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="a" id="a" />
                  <label htmlFor="a">Key A</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="c" id="c" />
                  <label htmlFor="c">Key C</label>
                </div>
              </RadioGroup>
            </div>

            <div className="mt-4 p-4 border border-border rounded">
              <h3 className="font-medium mb-2">
                File System Implementation Status
              </h3>
              <p className="text-sm mb-1">
                ✅ File tree representation in YAML
              </p>
              <p className="text-sm mb-1">✅ File system utilities created</p>
              <p className="text-sm mb-1">
                ✅ File system watcher implementation
              </p>
              <p className="text-sm mb-1">⚠️ Component integration pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
