import { BrowserWindow } from 'electron';

/**
 * Get a browser window from its ID safely
 */
export function getWindowFromId(id: number | null): BrowserWindow | null {
  if (id === null) return null;

  const webContents = BrowserWindow.fromId(id)?.webContents;
  if (!webContents) return null;

  return BrowserWindow.fromWebContents(webContents) || null;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Handle errors safely
 */
export function safelyHandleError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Safely parse JSON
 */
export function safelyParseJson<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
} 