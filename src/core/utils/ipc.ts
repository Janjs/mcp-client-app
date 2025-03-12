import { BrowserWindow } from "electron";

export function getWindowFromEvent(
  event: Electron.IpcMainInvokeEvent,
): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

export function getWindowIdFromEvent(
  event: Electron.IpcMainInvokeEvent,
): number | null {
  const window = getWindowFromEvent(event);
  return window?.id ?? null;
}
