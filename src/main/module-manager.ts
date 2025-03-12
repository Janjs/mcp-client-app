import { BrowserWindow } from 'electron';
import { AppModule } from './types';

/**
 * Registry for all application modules
 */
class ModuleManager {
  private modules: AppModule[] = [];

  /**
   * Register a new module with the application
   */
  registerModule(module: AppModule): void {
    console.log(`Registering module: ${module.name}`);
    this.modules.push(module);
  }

  /**
   * Initialize all registered modules
   */
  setupAllModules(): void {
    console.log('Setting up all modules');
    for (const module of this.modules) {
      try {
        console.log(`Setting up module: ${module.name}`);
        module.setupModule();
      } catch (error) {
        console.error(`Failed to setup module ${module.name}:`, error);
      }
    }
  }

  /**
   * Clean up all registered modules
   */
  cleanupAllModules(): void {
    console.log('Cleaning up all modules');
    for (const module of this.modules) {
      try {
        console.log(`Cleaning up module: ${module.name}`);
        module.cleanupModule();
      } catch (error) {
        console.error(`Failed to cleanup module ${module.name}:`, error);
      }
    }
  }

  /**
   * Setup all modules for a specific window
   */
  setupWindowForAllModules(window: BrowserWindow): void {
    console.log(`Setting up window ${window.id} for all modules`);
    for (const module of this.modules) {
      try {
        module.setupWindow(window);
      } catch (error) {
        console.error(`Failed to setup window for module ${module.name}:`, error);
      }
    }
  }

  /**
   * Clean up all modules for a specific window
   */
  cleanupWindowForAllModules(window: BrowserWindow): void {
    console.log(`Cleaning up window ${window.id} for all modules`);
    for (const module of this.modules) {
      try {
        module.cleanupWindow(window);
      } catch (error) {
        console.error(`Failed to cleanup window for module ${module.name}:`, error);
      }
    }
  }
}

// Export a singleton instance
export const moduleManager = new ModuleManager(); 