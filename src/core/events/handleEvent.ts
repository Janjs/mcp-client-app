import { BrowserWindow, IpcMainInvokeEvent } from "electron";
import { ConfiguredVault } from "@features/vault/types";
import { getActiveVault } from "@features/vault/backend/utils";
import { VaultFs } from "@features/vault/backend/services/vault-fs";
import { getVaultFs } from "@features/vault/backend/services/vault-fs";
import { getWindowVaultManager } from "@features/vault/backend/services/window-vault-manager";
import { WindowVaultManager } from "@features/vault/backend/services/window-vault-manager";

export interface EventBaseContext {
  window: BrowserWindow;
  windowId: number;
  vault: ConfiguredVault | null;
}

export interface EventFullContext extends EventBaseContext {
  utils: EventUtilsContext;
}

export async function getEventContext(
  event: IpcMainInvokeEvent,
): Promise<EventFullContext> {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    throw new Error("Could not determine source window");
  }

  const vault = await getActiveVault(window.id);
  const vaultFs = getVaultFs();
  const baseContext = {
    window,
    windowId: window.id,
    vault,
    vaultFs,
  };
  const utilsContext = getEventUtilsContext(baseContext);

  return {
    ...baseContext,
    utils: utilsContext,
  };
}

export interface EventUtilsContext {
  vaultFs: VaultFs;
  windowVaultManager: WindowVaultManager;
}

function getEventUtilsContext(
  _baseContext: Omit<EventFullContext, "utils">,
): EventUtilsContext {
  return {
    vaultFs: getVaultFs(),
    windowVaultManager: getWindowVaultManager(),
  };
}
