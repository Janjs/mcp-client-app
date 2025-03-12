import path from 'path';

/**
 * Base path for application data
 */
export const APP_DATA_PATH = path.join(
  process.env.APPDATA || 
  (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.local/share'),
  'mcp-client-app'
);

/**
 * Base path for application logs
 */
export const APP_LOGS_PATH = path.join(
  process.platform === 'darwin' ? process.env.HOME + '/Library/Logs' : APP_DATA_PATH,
  'mcp-client-app'
);

/**
 * Base path for application configuration
 */
export const APP_CONFIG_PATH = path.join(APP_DATA_PATH, 'config'); 