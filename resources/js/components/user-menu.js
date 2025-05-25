/**
 * User Menu Alpine.js Component
 * Handles user menu dropdown functionality
 */

export function userMenuComponent() {
  return {
    open: false,
    toggle() {
      this.open = !this.open;
    },
    close() {
      this.open = false;
    },
  };
}
