// Window Vibrancy Effects Manager for Tauri
import { invoke } from '@tauri-apps/api/core';

export class WindowVibrancy {
  /**
   * Apply native window effects (Mica on Windows, Vibrancy on macOS)
   * @param windowLabel - The label of the window to apply effects to
   */
  static async applyEffects(windowLabel: string = 'main'): Promise<void> {
    try {
      await invoke('apply_window_effects', { windowLabel });
      console.log(`✅ Applied native window effects to '${windowLabel}'`);
    } catch (error) {
      console.error(`❌ Failed to apply window effects to '${windowLabel}':`, error);
      throw error;
    }
  }

  /**
   * Clear native window effects
   * @param windowLabel - The label of the window to clear effects from
   */
  static async clearEffects(windowLabel: string = 'main'): Promise<void> {
    try {
      await invoke('clear_window_effects', { windowLabel });
      console.log(`✅ Cleared native window effects from '${windowLabel}'`);
    } catch (error) {
      console.error(`❌ Failed to clear window effects from '${windowLabel}':`, error);
      throw error;
    }
  }

  /**
   * Toggle window effects on/off
   * @param windowLabel - The label of the window
   * @param enabled - Whether to enable or disable effects
   */
  static async toggleEffects(windowLabel: string = 'main', enabled: boolean): Promise<void> {
    if (enabled) {
      await this.applyEffects(windowLabel);
    } else {
      await this.clearEffects(windowLabel);
    }
  }

  /**
   * Apply effects to all application windows
   */
  static async applyToAllWindows(): Promise<void> {
    const windows = ['main', 'scan-popup'];
    
    for (const windowLabel of windows) {
      try {
        await this.applyEffects(windowLabel);
      } catch (error) {
        // Continue with other windows even if one fails
        console.warn(`Failed to apply effects to '${windowLabel}', continuing...`);
      }
    }
  }

  /**
   * Initialize window effects based on system capabilities
   */
  static async initialize(): Promise<void> {
    try {
      // Apply effects to main window
      await this.applyEffects('main');
      
      // Apply effects to scan popup window if it exists
      try {
        await this.applyEffects('scan-popup');
      } catch (error) {
        // Scan popup might not be created yet, that's okay
        console.debug('Scan popup window not available for effects');
      }
    } catch (error) {
      console.warn('Native window effects not available on this platform');
    }
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Initialize on next tick to ensure Tauri is ready
  setTimeout(() => {
    WindowVibrancy.initialize().catch(console.warn);
  }, 100);
}

export default WindowVibrancy;
