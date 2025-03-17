import { appInitializer } from './app-initializer';

// Type augmentation for import.meta.env
declare global {
  interface ImportMetaEnv {
    MAIN_VITE_ANTHROPIC_API_KEY: string;
  }
}

/**
 * Main application entry point
 * This file is kept minimal by delegating most functionality to modules
 */

// Initialize the application
appInitializer.initialize();
