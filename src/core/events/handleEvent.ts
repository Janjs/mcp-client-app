import { BrowserWindow, IpcMainInvokeEvent } from "electron";
import { ConfiguredVault } from "@features/vault/types";
import { getActiveVault } from "@features/vault/backend/utils";
import { VaultFs } from "@features/vault/backend/services/vault-fs";
import { getVaultFs } from "@features/vault/backend/services/vault-fs";

export interface EventContext {
  window: BrowserWindow;
  vault: ConfiguredVault | null;
  vaultFs: VaultFs;
}

export async function getEventContext(
  event: IpcMainInvokeEvent,
): Promise<EventContext> {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error("Could not determine source window");
  }

  const vault = await getActiveVault(window.id);
  const vaultFs = getVaultFs();

  return {
    window,
    vault,
    vaultFs,
  };
}
