import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/shared/page-header/page-header";
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
        </div>
      </div>
    </>
  );
}
