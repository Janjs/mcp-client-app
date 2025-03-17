import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useVaults } from "@features/vault/frontend/hooks/useVaults";
import {
  Calendar,
  Smile,
  Calculator,
  User,
  CreditCard,
  Settings,
  Server,
} from "lucide-react";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
// Will use the router navigation after route tree regeneration
import { useNavigate } from "@tanstack/react-router";

const shortcut = window.environment.isMac ? "meta+k" : "ctrl+k";

export function AppCommandMenu() {
  const [open, setOpen] = useState(false);
  const { activeVault } = useVaults();
  const navigate = useNavigate();

  useHotkeys(shortcut, () => setOpen(true));

  const onSelect = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Vaults">
          <CommandItem
            onSelect={onSelect(() => {
              activeVault &&
                window.api.vault
                  .generateFileTree(activeVault.path)
                  .then((fileTree) => {
                    alert("File tree regenerated");
                    console.log(fileTree);
                  });
            })}
          >
            <Calendar />
            <span>Regenerate File Tree</span>
          </CommandItem>
          <CommandItem>
            <Smile />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem>
            <Calculator />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={onSelect(() =>
              navigate({ to: "/app/settings/mcp-servers" }),
            )}
          >
            <Server />
            <span>Manage MCP Servers</span>
            <CommandShortcut>⌘1</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={onSelect(() => navigate({ to: "/app/settings/models" }))}
          >
            <User />
            <span>Models</span>
            <CommandShortcut>⌘2</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
