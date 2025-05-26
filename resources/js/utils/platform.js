/**
 * Platform Detection Utility
 * Uses ua-parser-js to detect the user's platform for appropriate keyboard shortcuts
 */

import { UAParser } from 'ua-parser-js';

class PlatformDetector {
  constructor() {
    this.parser = new UAParser();
    this.os = this.parser.getOS();
  }

  /**
   * Check if the current platform is macOS
   * @returns {boolean}
   */
  isMacOS() {
    return this.os.name === 'Mac OS';
  }

  /**
   * Get the appropriate modifier key name for the platform
   * @returns {string} 'Cmd' for macOS, 'Ctrl' for others
   */
  getModifierKeyName() {
    return this.isMacOS() ? 'Cmd' : 'Ctrl';
  }

  /**
   * Get the appropriate modifier key symbol for the platform
   * @returns {string} '⌘' for macOS, 'Ctrl' for others
   */
  getModifierKeySymbol() {
    return this.isMacOS() ? '⌘' : 'Ctrl';
  }

  /**
   * Get a formatted keyboard shortcut string
   * @param {string} key - The key to combine with the modifier
   * @returns {string} Formatted shortcut like 'Cmd+S' or 'Ctrl+S'
   */
  getShortcutString(key) {
    return `${this.getModifierKeyName()}+${key.toUpperCase()}`;
  }

  /**
   * Get a formatted keyboard shortcut with symbols
   * @param {string} key - The key to combine with the modifier
   * @returns {string} Formatted shortcut like '⌘S' or 'Ctrl+S'
   */
  getShortcutSymbol(key) {
    const modifier = this.getModifierKeySymbol();
    const separator = this.isMacOS() ? '' : '+';
    return `${modifier}${separator}${key.toUpperCase()}`;
  }

  /**
   * Create HTML for keyboard shortcut display using <kbd> elements
   * @param {string} key - The key to combine with the modifier
   * @returns {string} HTML string with <kbd> elements
   */
  getShortcutHTML(key) {
    const modifier = this.getModifierKeySymbol();
    const keyUpper = key.toUpperCase();

    if (this.isMacOS()) {
      return `<kbd class="kbd-mac">${modifier}</kbd><kbd>${keyUpper}</kbd>`;
    } else {
      return `<kbd>${modifier}</kbd><kbd>+</kbd><kbd>${keyUpper}</kbd>`;
    }
  }
}

// Create a singleton instance
const platformDetector = new PlatformDetector();

// Export both the class and the singleton instance
export { PlatformDetector, platformDetector };

// Also make it available globally for use in Edge templates
window.platformDetector = platformDetector;
