/**
 * Mobile Menu Alpine.js Component
 * Handles mobile navigation menu functionality
 */

export function mobileMenuComponent() {
  return {
    open: false,
    toggle() {
      this.open = !this.open
    },
    close() {
      this.open = false
    },
  }
}
